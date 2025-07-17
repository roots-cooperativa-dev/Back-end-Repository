import { forwardRef, Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donate } from './entities/donation.entity';
import { Users } from '../users/Entyties/users.entity';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donate, Users]),
    forwardRef(() => UsersModule),
  ],
  controllers: [DonationsController],
  providers: [DonationsService, MercadoPagoService],
  exports: [DonationsService, MercadoPagoService],
})
export class DonationsModule {}
