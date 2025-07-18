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
        this.logger.warn(`Usuario no encontrado: ${userId}`);
        throw new NotFoundException('Usuario no encontrado');
      }

      const existing = await this.donateRepository.findOne({
        where: { pagoId: dto.pagoId },
      });

      if (existing) {
        this.logger.warn(`Pago duplicado detectado: ${dto.pagoId}`);
        throw new ConflictException('Este pago ya fue procesado');
      }

      if (dto.amount <= 0) {
        throw new BadRequestException('El monto debe ser mayor a 0');
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
        this.logger.log(`Usuario ${userId} marcado como donador`);
      }

      this.logger.log(`Donación creada exitosamente: ${saved.id}`);
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
          'Error de base de datos al crear donación:',
          error.message,
        );
        throw new InternalServerErrorException('Error al guardar la donación');
      }

      this.logger.error('Error inesperado al crear donación:', error);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async findAll(page?: number, limit?: number): Promise<ResponseDonateDto[]> {
    try {
      if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
        throw new BadRequestException(
          'Page debe ser un entero positivo desde 1',
        );
      }

      if (
        limit !== undefined &&
        (!Number.isInteger(limit) || limit < 1 || limit > 100)
      ) {
        throw new BadRequestException('Limit debe ser un entero entre 1 y 100');
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

      this.logger.log(`Recuperadas ${donations.length} donaciones`);
      return ResponseDonateDto.toDTOList(donations);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        this.logger.error(
          'Error de base de datos al recuperar donaciones:',
          error.message,
        );
        throw new InternalServerErrorException('Error al recuperar donaciones');
      }

      this.logger.error('Error inesperado al recuperar donaciones:', error);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async findOne(id: string): Promise<ResponseDonateDto> {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(id)) {
        throw new BadRequestException(
          'Formato de ID inválido. Debe ser un UUID válido',
        );
      }

      const donation = await this.donateRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!donation) {
        throw new NotFoundException(`Donación con ID ${id} no encontrada`);
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
        this.logger.error(
          'Error de base de datos al recuperar donación:',
          error.message,
        );
        throw new InternalServerErrorException(
          'Error al recuperar la donación',
        );
      }

      this.logger.error('Error inesperado al recuperar donación:', error);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }
}
