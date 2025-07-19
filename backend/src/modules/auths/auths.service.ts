import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/Dtos/CreateUserDto';
import { ResponseUserDto } from '../users/interface/IUserResponseDto';
import { GoogleUser } from './strategies/google.strategy';
import { AuthValidations } from './validate/auth.validate';
import { AuthResponse, IUserAuthResponse } from './interface/IAuth.interface';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthsService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async signin(email: string, password: string): Promise<AuthResponse> {
    AuthValidations.validateCredentials(email, password);

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    try {
      await this.mailService.sendLoginNotification(
        user.email,
        user.name || user.username || 'Usuario',
      );
      console.log(`Correo de notificación de login enviado a ${user.email}`);
    } catch (error) {
      console.error(
        `Error al enviar correo de notificación de login a ${user.email}:`,
        error,
      );
    }
    return this.generateAuthResponse(user);
  }

  async signup(data: CreateUserDto): Promise<ResponseUserDto> {
    const { password, confirmPassword, ...rest } = data;

    AuthValidations.validatePasswordMatch(password, confirmPassword);

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await this.userService.createUserService({
        ...rest,
        password: hashedPassword,
        isAdmin: false,
        isDonator: false,
      });
      try {
        await this.mailService.sendWelcomeEmail(
          createdUser.email,
          createdUser.name || createdUser.username || 'Usuario',
        );
        console.log(`Correo de bienvenida enviado a ${createdUser.email}`);
      } catch (error) {
        console.error(
          `Error al enviar correo de bienvenida a ${createdUser.email}:`,
          error,
        );
      }

      return ResponseUserDto.toDTO(createdUser);
    } catch (error) {
      AuthValidations.handleSignupError(error);
    }
  }

  async googleLogin(googleUser: GoogleUser): Promise<AuthResponse> {
    if (!googleUser.email) {
      throw new BadRequestException(
        'Email requerido para autenticación con Google',
      );
    }

    let user = await this.userService.findByEmail(googleUser.email);
    let isNewUser = false;

    if (!user) {
      user = await this.createUserFromGoogleProfile(googleUser);
      isNewUser = true;
    }
    try {
      if (isNewUser) {
        await this.mailService.sendWelcomeEmail(
          user.email,
          user.name || user.username || 'Usuario',
        );
        console.log(
          `Correo de bienvenida (Google) enviado a ${user.email} (nuevo usuario).`,
        );
      } else {
        await this.mailService.sendLoginNotification(
          user.email,
          user.name || user.username || 'Usuario',
        );
        console.log(
          `Correo de notificación de login (Google) enviado a ${user.email} (usuario existente).`,
        );
      }
    } catch (error) {
      console.error(
        `Error al enviar correo (bienvenida o login) para ${user.email}:`,
        error,
      );
    }

    return this.generateAuthResponse(user);
  }

  private async createUserFromGoogleProfile(googleUser: GoogleUser) {
    const randomPassword = await AuthValidations.generateRandomPassword();
    const username = AuthValidations.generateUsernameFromEmail(
      googleUser.email,
    );

    return await this.userService.createUserService({
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

  private generateAuthResponse(user: IUserAuthResponse): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isDonator: user.isDonator,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: 3600,
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
