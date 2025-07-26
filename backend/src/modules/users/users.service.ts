import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
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
import { Address } from './Entyties/address.entity';
import { ConfigService } from '@nestjs/config';
import { MapboxGeocodingResponse } from './interface/IUserResponseDto';
import { CreateAddressDto } from './Dtos/create-address.dto';
import { UpdateRoleDto } from './Dtos/UpdateRoleDto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly configService: ConfigService,
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
        const address = await this.createAddressWithCoordinates(dto.address);
        const user = this.usersRepository.create({ ...dto, address });
        return await this.usersRepository.save(user);
      } else {
        const user = this.usersRepository.create(dto);
        return await this.usersRepository.save(user);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating user:', error);
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
  }

  async rollChange(userId: string, dto: UpdateRoleDto) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
      }

      const result = await this.usersRepository.update(user.id, dto);
      return result;
    } catch (error) {
      this.logger.error('Error changing user role:', error);
      throw new InternalServerErrorException('Error changing user role');
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const result = await this.usersRepository.softDelete(id);

      if (!result.affected) {
        throw new NotFoundException(`User: ${id} not found`);
      }

      return { message: `User ${id} successfully removed.` };
    } catch (error) {
      this.logger.error(
        'Error: Al eliminar la cuenta intente mas tarde',
        error,
      );
      throw new InternalServerErrorException(`Error deleting User ${id}`);
    }
  }

  private async createAddressWithCoordinates(
    addressDto: CreateAddressDto,
  ): Promise<Address> {
    const token = this.configService.get<string>('MAPBOX_TOKEN');

    if (!token) {
      throw new BadRequestException('Mapbox token no configurado');
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          addressDto.street,
        )}.json?access_token=${token}`,
      );

      if (!response.ok) {
        throw new BadRequestException(
          'Error consultando servicio de geocodificación',
        );
      }

      const data = (await response.json()) as MapboxGeocodingResponse;

      if (!Array.isArray(data.features) || !data.features[0]?.center) {
        throw new BadRequestException('Dirección no encontrada o inválida');
      }

      const [longitude, latitude] = data.features[0].center;
      const address = this.addressRepository.create({
        ...addressDto,
        latitude,
        longitude,
      });

      return await this.addressRepository.save(address);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error geocoding address:', error);
      throw new BadRequestException('Error procesando la dirección');
    }
  }
}
