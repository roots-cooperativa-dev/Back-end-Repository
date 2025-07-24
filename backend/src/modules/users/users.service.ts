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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async getUsers(pagination: PaginationQueryDto) {
    return paginate(this.usersRepository, pagination, {
      order: { createdAt: 'DESC' },
    });
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['donates', 'orders'],
    });

    console.log('👤 Usuario con donaciones:', user?.donates);

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
      const user = this.usersRepository.create(dto);
      return this.usersRepository.save(user);
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async updateUserService(
    id: string,
    dto: Partial<UpdateUserDbDto>,
  ): Promise<Users> {
    if ('isAdmin' in dto) delete dto.isAdmin;

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

  async deleteUserService(id: string): Promise<{ id: string }> {
    const result = await this.usersRepository.delete({ id: String(id) });
    if (!result.affected) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return { id: String(id) };
  }
}
