import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository, QueryFailedError } from 'typeorm';

import { Donate } from './entities/donation.entity';
import { Users } from '../users/Entyties/users.entity';
import { CreateDonateDto, PaymentStatus } from './dto/create-donation.dto';
import { ResponseDonateDto } from './interface/IDonateResponse';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donate)
    private readonly donateRepository: Repository<Donate>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
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

      if (dto.status === PaymentStatus.APPROVED && !user.isDonator) {
        user.isDonator = true;
        await this.userRepository.save(user);
        this.logger.log(`User ${userId} marked as donor`);
      }

      this.logger.log(`Donation created successfully: ${saved.id}`);
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

  async findAll(page?: number, limit?: number): Promise<ResponseDonateDto[]> {
    try {
      if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
        throw new BadRequestException(
          'Page must be a positive integer starting from 1',
        );
      }

      if (
        limit !== undefined &&
        (!Number.isInteger(limit) || limit < 1 || limit > 100)
      ) {
        throw new BadRequestException(
          'Limit must be an integer between 1 and 100',
        );
      }

      const options: FindManyOptions<Donate> = {
        relations: ['user'],
        order: { dateApproved: 'DESC' },
      };

      if (page && limit) {
        options.skip = (page - 1) * limit;
        options.take = limit;
      }

      const donations = await this.donateRepository.find(options);

      this.logger.log(`Recovered ${donations.length} donations`);
      return ResponseDonateDto.toDTOList(donations);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        this.logger.error(
          'Database error retrieving donations:',
          error.message,
        );
        throw new InternalServerErrorException('Error retrieving donations');
      }

      this.logger.error('Unexpected error retrieving donations:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
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
}
