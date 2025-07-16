import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository, QueryFailedError } from 'typeorm';

import { Donate } from './entities/donation.entity';
import { Users } from '../users/Entyties/users.entity';
import { CreateDonateDto } from './dto/create-donation.dto';
import { ResponseDonateDto } from './interface/IDonateResponse';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donate)
    private readonly donateRepository: Repository<Donate>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async create(
    userId: string,
    dto: CreateDonateDto,
  ): Promise<ResponseDonateDto> {
    try {
      const {
        pagoId,
        status,
        statusDetail,
        transactionAmount,
        currencyId,
        paymentTypeId,
        paymentMethodId,
        dateApproved,
      } = dto;

      if (!pagoId || !status || !transactionAmount) {
        throw new BadRequestException(
          'Required fields are missing: pagoId, status, and transactionAmount are mandatory',
        );
      }

      if (transactionAmount <= 0) {
        throw new BadRequestException(
          'Transaction amount must be greater than zero',
        );
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const existingDonation = await this.donateRepository.findOne({
        where: { pagoId },
      });

      if (existingDonation) {
        throw new ConflictException(
          `Donation with payment ID ${pagoId} already exists`,
        );
      }

      let parsedDate: Date;
      try {
        parsedDate = new Date(dateApproved);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        console.error('Error parsing dateApproved:', error);
        throw new BadRequestException(
          'Invalid date format for dateApproved. Please use a valid date string',
        );
      }

      const donation = this.donateRepository.create({
        pagoId,
        status,
        statusDetail,
        transactionAmount,
        currencyId,
        paymentTypeId,
        paymentMethodId,
        dateApproved: parsedDate,
        user,
      });

      const savedDonation = await this.donateRepository.save(donation);

      if (!user.isDonator) {
        user.isDonator = true;
        await this.userRepository.save(user);
      }

      return ResponseDonateDto.toDTO(savedDonation);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key')) {
          throw new ConflictException(
            'Donation with this payment ID already exists',
          );
        }
        if (error.message.includes('foreign key')) {
          throw new BadRequestException(
            'Invalid reference to user or related entity',
          );
        }
        throw new BadRequestException(
          'Database validation failed. Please check your data',
        );
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the donation',
      );
    }
  }

  async findAll(page?: number, limit?: number): Promise<ResponseDonateDto[]> {
    try {
      if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
        throw new BadRequestException(
          'Page must be a positive integer starting from 1',
        );
      }

      if (
        limit !== undefined &&
        (limit < 1 || limit > 100 || !Number.isInteger(limit))
      ) {
        throw new BadRequestException(
          'Limit must be a positive integer between 1 and 100',
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

      if (!donations || donations.length === 0) {
        return [];
      }

      return ResponseDonateDto.toDTOList(donations);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException(
          'Database error occurred while retrieving donations',
        );
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving donations',
      );
    }
  }

  async findOne(id: string): Promise<ResponseDonateDto> {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new BadRequestException(
          'Invalid ID format. Please provide a valid UUID',
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
        throw new InternalServerErrorException(
          'Database error occurred while retrieving donation',
        );
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving the donation',
      );
    }
  }
}
