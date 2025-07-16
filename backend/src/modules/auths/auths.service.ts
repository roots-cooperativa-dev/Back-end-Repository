import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/Dtos/CreateUserDto';
import { ResponseUserDto } from '../users/interface/IUserResponseDto';

@Injectable()
export class AuthsService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signin(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const user = await this.userService.findByEmail(email);

    const isMatch = user && (await bcrypt.compare(password, user.password));

    if (!user || !isMatch) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async signup(data: CreateUserDto) {
    const { password, confirmPassword, ...rest } = data;

    if (!password || !confirmPassword) {
      throw new BadRequestException('Debe proporcionar ambas contraseñas');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await this.userService.createUserService({
        ...rest,
        password: hashedPassword,
        isAdmin: false,
        isDonator: false,
      });

      return ResponseUserDto.toDTO(createdUser);
    } catch (err) {
      console.error('[AuthsService:signup] →', err);
      throw new InternalServerErrorException('Error al registrar usuario');
    }
  }

  async googleLogin(googleUser: {
    id: string;
    name: string;
    email: string;
    accessToken: string;
  }) {
    let user = await this.userService.findByEmail(googleUser.email);

    if (!user) {
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-8) + 'Aa1!',
        10,
      );

      const username = googleUser.email.split('@')[0]; // Crea username del email

      user = await this.userService.createUserService({
        name: googleUser.name,
        email: googleUser.email,
        birthdate: new Date().toISOString().split('T')[0],
        username,
        password: randomPassword,
        phone: 0,
        isAdmin: false,
        isDonator: false,
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate,
        username: user.username,
        phone: user.phone,
      },
    };
  }
}
