import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';

import { Donate } from './entities/donation.entity';
import { Users } from '../users/Entyties/users.entity';
import { CreateDonateDto } from './dto/create-donation.dto';
import { ResponseDonateDto } from './interface/IDonateResponse';
import { MailService } from '../mail/mail.service';
import { PaginationQueryDonationDto } from './dto/donations.paginate';
import { paginate } from 'src/common/pagination/paginate';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donate)
    private readonly donateRepository: Repository<Donate>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    private readonly mailService: MailService,
  ) {}

  async createDonate(
    userId: string,
    dto: CreateDonateDto,
  ): Promise<ResponseDonateDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User not Found: ${userId}`);
        throw new NotFoundException('User not Found');
      }

      const existing = await this.donateRepository.findOne({
        where: { pagoId: dto.pagoId },
      });

      if (existing) {
        this.logger.warn(`Duplicate payment detected: ${dto.pagoId}`);
        throw new ConflictException('This payment has already been processed');
      }

      if (dto.amount <= 0) {
        throw new BadRequestException('The amount must be greater than 0');
      }

      const donate = this.donateRepository.create({
        pagoId: dto.pagoId,
        status: dto.status,
        statusDetail: dto.statusDetail,
        amount: dto.amount,
        currencyId: dto.currencyId,
        paymentTypeId: dto.paymentTypeId || 'unknown',
        paymentMethodId: dto.paymentMethodId || 'unknown',
        dateApproved: dto.dateApproved || new Date(),
        user,
      });

      const saved = await this.donateRepository.save(donate);

      if (donate) {
        user.isDonator = true;
        await this.userRepository.save(user);
        this.logger.log(`User ${userId} marked as donor`);
      }

      this.logger.log(`Donation created successfully: ${saved.id}`);

      this.sendDoantionNotificationAsync(user.email);
      this.sendDoantionNotificationAsyncToAdmin(
        user.username,
        donate.amount,
        user.email,
        user.phone,
      );

      return ResponseDonateDto.toDTO(saved);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        this.logger.error(
          'Database error when creating donation:',
          error.message,
        );
        throw new InternalServerErrorException('Error saving donation');
      }

      this.logger.error('Unexpected error creating donation:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findAllDonations(pagination: PaginationQueryDonationDto) {
    return paginate(this.donateRepository, pagination, {
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<ResponseDonateDto> {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(id)) {
        throw new BadRequestException(
          'Invalid ID format. Must be a valid UUID',
        );
      }

      const donation = await this.donateRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!donation) {
        throw new NotFoundException(`Donation with ID ${id} not found`);
      }

      return ResponseDonateDto.toDTO(donation);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        this.logger.error('Database error retrieving donation:', error.message);
        throw new InternalServerErrorException('Error retrieving donation');
      }

      this.logger.error('Unexpected error retrieving donation:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private sendDoantionNotificationAsync(email: string): void {
    this.mailService
      .sendDonationThanks(email)
      .then(() => {
        this.logger.log(
          `Correo de notificación de donacion enviado a ${email}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Donation notification email sent to ${email}:`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }

  private sendDoantionNotificationAsyncToAdmin(
    name: string,
    amount: number,
    email: string,
    phone: number,
  ): void {
    this.mailService
      .sendDonationAlertToAdmin(name, amount, email, phone)
      .then(() => {
        this.logger.log('Alerta de nueva donación enviada al admin');
      })
      .catch((error) => {
        this.logger.error(
          'Error enviando alerta de donación al admin:',
          error instanceof Error ? error.message : String(error),
        );
      });
  }
}
