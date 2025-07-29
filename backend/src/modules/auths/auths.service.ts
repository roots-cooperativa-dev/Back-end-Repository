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
import { NewsletterService } from '../scheduleLetters/newsletter.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../users/Entyties/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthsService {
  private readonly logger = new Logger(AuthsService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly newsletterService: NewsletterService,
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
    const email = await this.userService.findByEmail(userData.email);
    AuthValidations.validateEmailIsNotTaken(email?.email);
    const existingUser = await this.usersRepository.findOne({
      where: { username: userData.username },
      select: ['id', 'username'],
    });
    if (existingUser) {
      AuthValidations.validateUserNameExist(userData.username, existingUser);
    }

    try {
      const hashedPassword = await AuthValidations.hashPassword(password);
      const createdUser = await this.userService.createUserService({
        ...userData,
        password: hashedPassword,
        isAdmin: false,
        isDonator: false,
        isSuperAdmin: false,
      });

      this.sendWelcomeEmailAsync(
        createdUser.email,
        AuthValidations.getUserDisplayName(createdUser),
      );
      await this.newsletterService.sendWelcomeNewsletter({
        name: AuthValidations.getUserDisplayName(createdUser),
        email: createdUser.email,
      });
      this.logger.log(
        `Segundo correo de bienvenida (Newsletter) enviado a ${createdUser.email}`,
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

    const user = await this.userService.createUserService({
      name: googleUser.name,
      email: googleUser.email,
      birthdate: new Date().toISOString().split('T')[0],
      username,
      password: randomPassword,
      phone: 0,
      address: {
        street: 'Sin dirección',
        latitude: 0,
        longitude: 0,
      },
      isAdmin: false,
      isSuperAdmin: false,
      isDonator: false,
    });
    await this.mailService.sendWelcomeEmail(googleUser.email, googleUser.name);
    await this.newsletterService.sendWelcomeNewsletter({
      name: googleUser.name,
      email: googleUser.email,
    });

    this.logger.log(
      `Newsletter de bienvenida (Google Login) enviada a nuevo usuario: ${googleUser.email}`,
    );

    return user;
  }

  private generateAuthResponse(user: IUserAuthResponse): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
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
        address:
          typeof user.address === 'string'
            ? user.address
            : (user.address?.street ?? ''),
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
