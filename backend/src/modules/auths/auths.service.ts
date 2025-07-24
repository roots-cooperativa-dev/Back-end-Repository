import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/Dtos/CreateUserDto';
import { ResponseUserDto } from '../users/interface/IUserResponseDto';

import { AuthValidations } from './validate/auth.validate';
import {
  AuthResponse,
  GoogleUser,
  IUserAuthResponse,
} from './interface/IAuth.interface';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthsService {
  private readonly logger = new Logger(AuthsService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async signin(email: string, password: string): Promise<AuthResponse> {
    AuthValidations.validateCredentials(email, password);

    const user = await this.findUserByEmail(email);
    AuthValidations.validateUserHasPassword(user);
    await AuthValidations.validatePassword(password, user.password);

    this.sendLoginNotificationAsync(
      user.email,
      AuthValidations.getUserDisplayName(user),
    );

    return this.generateAuthResponse(user);
  }

  async signup(data: CreateUserDto): Promise<ResponseUserDto> {
    const { password, confirmPassword, ...userData } = data;

    AuthValidations.validatePasswordMatch(password, confirmPassword);

    try {
      const hashedPassword = await AuthValidations.hashPassword(password);
      const createdUser = await this.userService.createUserService({
        ...userData,
        password: hashedPassword,
        isAdmin: false,
        isDonator: false,
      });

      this.sendWelcomeEmailAsync(
        createdUser.email,
        AuthValidations.getUserDisplayName(createdUser),
      );

      return ResponseUserDto.toDTO(createdUser);
    } catch (error) {
      AuthValidations.handleSignupError(error);
    }
  }

  async googleLogin(googleUser: GoogleUser): Promise<AuthResponse> {
    this.validateGoogleUser(googleUser);

    const foundUser = await this.userService.findByEmail(googleUser.email);
    let user: IUserAuthResponse;
    let isNewUser = false;

    if (!foundUser) {
      user = await this.createUserFromGoogleProfile(googleUser);
      isNewUser = true;
    } else {
      user = foundUser as IUserAuthResponse;
    }

    this.sendEmailNotificationAsync(user, isNewUser);

    return this.generateAuthResponse(user);
  }

  private async createUserFromGoogleProfile(
    googleUser: GoogleUser,
  ): Promise<IUserAuthResponse> {
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
      address: 'calle falsa 123',
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
        address: user.address,
        username: user.username,
        phone: user.phone,
      },
    };
  }

  private async findUserByEmail(
    email: string,
  ): Promise<IUserAuthResponse & { password?: string }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user as IUserAuthResponse & { password?: string };
  }

  private validateGoogleUser(googleUser: GoogleUser): void {
    if (!googleUser.email) {
      throw new BadRequestException(
        'Email required for authentication with Google',
      );
    }
  }

  private sendWelcomeEmailAsync(email: string, displayName: string): void {
    this.mailService
      .sendWelcomeEmail(email, displayName)
      .then(() => {
        this.logger.log(`Correo de bienvenida enviado a ${email}`);
      })
      .catch((error) => {
        this.logger.error(
          `Error sending welcome email to ${email}:`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }

  private sendLoginNotificationAsync(email: string, displayName: string): void {
    this.mailService
      .sendLoginNotification(email, displayName)
      .then(() => {
        this.logger.log(`Correo de notificación de login enviado a ${email}`);
      })
      .catch((error) => {
        this.logger.error(
          `Login notification email sent to ${email}:`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }

  private sendEmailNotificationAsync(
    user: IUserAuthResponse,
    isNewUser: boolean,
  ): void {
    const displayName = AuthValidations.getUserDisplayName(user);

    if (isNewUser) {
      this.sendWelcomeEmailAsync(user.email, displayName);
      this.logger.log(
        `Processing welcome email (Google) for ${user.email} (new user)`,
      );
    } else {
      this.sendLoginNotificationAsync(user.email, displayName);
      this.logger.log(
        `Processing login notification email (Google) for ${user.email} (existing user)`,
      );
    }
  }
}
