import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';

import { UsersModule } from '../users/users.module';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { AuthGuard } from '../../guards/auth.guards';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';

dotenv.config({ path: '.env.development' });

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
  ],
  providers: [AuthsService, AuthGuard, GoogleStrategy],
  controllers: [AuthsController],
  exports: [JwtModule, AuthGuard],
})
export class AuthsModule {}
