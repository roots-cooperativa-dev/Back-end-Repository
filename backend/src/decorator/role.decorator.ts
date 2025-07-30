import { SetMetadata } from '@nestjs/common';
export enum UserRole {
  USER = 'user',
  DONOR_USER = 'donorUser',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superAdmin',
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
