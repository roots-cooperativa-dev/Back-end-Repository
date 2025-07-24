import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guards';
import { AuthRequest } from 'src/common/auth-request.interface';

@Injectable()
export class DonatorGuard extends AuthGuard implements CanActivate {
  constructor(
    jwtService: JwtService,
    private reflector: Reflector,
  ) {
    super(jwtService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);
    if (!canActivate) return false;

    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (roles.includes('donorUser') && !request.user.isDonator) {
      throw new ForbiddenException('Access restricted to donators');
    }

    return true;
  }
}
