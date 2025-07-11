import { Injectable } from '@nestjs/common';
import { Users } from './Entyties/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './Dtos/CreateUserDto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}
  async getUsers(page: number, limit: number): Promise<Users[]> {
    return this.usersRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }, // ordena por fecha, opcional
    });
  }
  async updateUserById(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.getUserById(id);
  }
  async getUserById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }
}
