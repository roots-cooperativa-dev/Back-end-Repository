import { SetMetadata } from '@nestjs/common';
export enum UserRole {
  USER = 'user',
  DONOR_USER = 'donorUser',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
