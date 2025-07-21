import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { GoogleUser, IUserAuthResponse } from '../interface/IAuth.interface';

export class AuthValidations {
  private static readonly BCRYPT_ROUNDS = 12;

  static validateCredentials(email: string, password: string): void {
    if (!email || !password) {
      throw new BadRequestException('Email y contraseña son requeridos');
    }
  }

  static validatePasswordMatch(
    password: string,
    confirmPassword: string,
  ): void {
    if (!password || !confirmPassword) {
      throw new BadRequestException('Debe proporcionar ambas contraseñas');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
  }

  static generateUsernameFromEmail(email: string): string {
    return email.split('@')[0];
  }

  static async generateRandomPassword(): Promise<string> {
    const randomString = Math.random().toString(36).slice(-8) + 'Aa1!';
    return await bcrypt.hash(randomString, this.BCRYPT_ROUNDS);
  }

  static handleSignupError(error: any): never {
    console.error('[AuthsService:signup] →', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    ) {
      throw new BadRequestException('El email o username ya existe');
    }

    throw new InternalServerErrorException('Error al registrar usuario');
  }

  static validateUserExists(user: any): asserts user is IUserAuthResponse {
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  static validateUserHasPassword(
    user: IUserAuthResponse & { password?: string },
  ): asserts user is IUserAuthResponse & { password: string } {
    if (!user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  static async validatePassword(
    inputPassword: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValidPassword = await bcrypt.compare(inputPassword, hashedPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  static validateGoogleUser(googleUser: GoogleUser): void {
    if (!googleUser.email) {
      throw new BadRequestException(
        'Email requerido para autenticación con Google',
      );
    }
  }

  static getUserDisplayName(user: IUserAuthResponse): string {
    return user.name || user.username || 'Usuario';
  }
}
