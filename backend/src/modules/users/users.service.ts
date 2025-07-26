import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Users } from './Entyties/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDbDto, UpdateUserDbDto } from './Dtos/CreateUserDto';
import { PaginationQueryDto } from './Dtos/PaginationQueryDto';
import { paginate } from 'src/common/pagination/paginate';
import { UpdatePasswordDto } from './Dtos/UpdatePasswordDto';
import { AuthValidations } from '../auths/validate/auth.validate';
import * as bcrypt from 'bcrypt';
import { Address } from '../addresses/entities/address.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { Logger } from '@nestjs/common';

interface MapboxGeocodingResponse {
  features: {
    center: [number, number];
  }[];
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async getUsers(pagination: PaginationQueryDto) {
    return paginate(this.usersRepository, pagination, {
      order: { createdAt: 'DESC' },
    });
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'donates',
        'orders',
        'appointments',
        'address',
        'cart',
        'cart.items',
        'cart.items.product',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'isAdmin', 'isDonator'],
    });
  }

  async createUserService(dto: CreateUserDbDto): Promise<Users> {
    try {
      if (dto.address) {
        const token = this.configService.get<string>('MAPBOX_TOKEN');
        const direccion = dto.address.street;

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            direccion,
          )}.json?access_token=${token}`,
        );

        const data = (await response.json()) as MapboxGeocodingResponse;

        if (!Array.isArray(data.features) || !data.features[0]?.center) {
          throw new BadRequestException('Dirección inválida');
        }

        const [longitude, latitude] = data.features[0].center;
        const address = this.addressRepository.create({
          ...dto.address,
          latitude,
          longitude,
        });
        await this.addressRepository.save(address);
        const user = this.usersRepository.create({ ...dto, address });
        return await this.usersRepository.save(user);
      } else {
        const user = this.usersRepository.create(dto);
        return await this.usersRepository.save(user);
      }
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async updateUserService(
    id: string,
    dto: Partial<UpdateUserDbDto>,
  ): Promise<Users> {
    const camposRestringidos = ['isAdmin', 'isDonator', 'isSuperAdmin'];

    for (const campo of camposRestringidos) {
      if (Object.prototype.hasOwnProperty.call(dto, campo)) {
        delete dto[campo];
      }
    }

    const result = await this.usersRepository.update({ id }, dto);

    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    const updatedUser = await this.usersRepository.findOne({
      where: { id },
    });

    if (!updatedUser) {
      throw new InternalServerErrorException(
        `Error inesperado: Usuario con id ${id} no encontrado tras la actualización`,
      );
    }
    this.mailService
      .sendUserDataChangedNotification(updatedUser.email, updatedUser.name)
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Error desconocido al enviar email de modificación de datos';
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(message, stack);
      });

    return updatedUser;
  }

  async changePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la actual',
      );
    }

    await AuthValidations.validateNewPasswordIsDifferent(
      dto.newPassword,
      user.password,
    );

    await AuthValidations.validatePassword(dto.currentPassword, user.password);

    const hashedPassword = await AuthValidations.hashPassword(dto.newPassword);

    user.password = hashedPassword;
    await this.usersRepository.save(user);

    this.mailService
      .sendPasswordResetEmail(user.name, user.email)
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Error desconocido al enviar email';
        const stack = err instanceof Error ? err.stack : undefined;

        this.logger.error(message, stack);
      });
  }
}
