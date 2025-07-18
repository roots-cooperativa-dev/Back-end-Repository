import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { AuthGuard } from '../../guards/auth.guards';
import { GoogleStrategy } from './strategies/google.strategy';
import google0authConfig from 'src/config/google-0auth.config';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('SUPABASE_JWT_SECRET'),
      }),
    }),
    ConfigModule.forFeature(google0authConfig),
  ],
  providers: [AuthsService, AuthGuard, GoogleStrategy],
  controllers: [AuthsController],
  exports: [JwtModule, AuthGuard, AuthsService],
})
export class AuthsModule {}
