import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { AuthGuard } from '../../guards/auth.guards';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import google0authConfig from 'src/config/google-0auth.config';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
    ConfigModule.forRoot({
      load: [google0authConfig],
      isGlobal: true,
    }),
  ],
  providers: [AuthsService, AuthGuard, GoogleStrategy],
  controllers: [AuthsController],
  exports: [JwtModule, AuthGuard],
})
export class AuthsModule {}
