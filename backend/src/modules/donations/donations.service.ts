import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['donates'],
    });

    if (!user) {
      throw new BadRequestException(`El usuario con ID ${userId} no existe`);
    }

    const donation = this.donateRepository.create({
      pagoId,
      status,
      statusDetail,
      transactionAmount,
      currencyId,
      paymentTypeId,
      paymentMethodId,
      dateApproved: new Date(dateApproved),
      user,
    });

    if (!donation.pagoId || !donation.status || !donation.transactionAmount) {
      throw new BadRequestException('Datos de donación incompletos');
    }

    const savedDonation = await this.donateRepository.save(donation);

    if (!user.isDonator) {
      user.isDonator = true;
      await this.userRepository.save(user);
    }

    return ResponseDonateDto.toDTO(savedDonation);
  }

  async findAll(page?: number, limit?: number): Promise<Donate[]> {
    if (page && limit) {
      return await this.donateRepository.find({
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      return await this.donateRepository.find();
    }
  }

  async findOne(id: string): Promise<Donate> {
    const donator = await this.donateRepository.findOne({ where: { id } });
    if (!donator) {
      throw new NotFoundException(`El donador con id ${id} no fue encontrado`);
    }
    return donator;
  }
}
