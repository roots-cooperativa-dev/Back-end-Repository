import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './Entyties/users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthsModule } from '../auths/auths.module';
import { DonationsModule } from '../donations/donations.module';
import { MailModule } from '../mail/mail.module';
import { Address } from './Entyties/address.entity';
import { AddressService } from './address.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Address]),
    forwardRef(() => AuthsModule),
    forwardRef(() => DonationsModule),
    MailModule,
  ],
  providers: [UsersService, AddressService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
