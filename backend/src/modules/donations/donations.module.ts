import { forwardRef, Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donate } from './entities/donation.entity';
import { Users } from '../users/Entyties/users.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PaymentsModule } from '../payments/payment.module';
import { PaymentCompletedListener } from '../payments/listener/payment.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donate, Users]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [DonationsController],
  providers: [DonationsService, PaymentCompletedListener],
  exports: [DonationsService],
})
export class DonationsModule {}
