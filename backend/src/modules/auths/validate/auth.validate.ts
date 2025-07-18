import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class AuthValidations {
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
    return await bcrypt.hash(randomString, 10);
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
}
