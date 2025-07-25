import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Users } from '../users/Entyties/users.entity';
import { PaymentsController } from './payment.controller';
import { PaymentsService } from './payment.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MercadoPagoService } from './mercadopago.service';
import { Donate } from '../donations/entities/donation.entity';
import { DonationsModule } from '../donations/donations.module';
import { AuthsModule } from '../auths/auths.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Users, Donate]),
    forwardRef(() => DonationsModule),
    EventEmitterModule.forRoot(),
    forwardRef(() => AuthsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoService],
  exports: [PaymentsService, MercadoPagoService],
})
export class PaymentsModule {}
