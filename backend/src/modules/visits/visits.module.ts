import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from './entities/visit.entity';
import { VisitSlot } from './entities/visit-slot.entity';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { AuthsModule } from '../auths/auths.module';
import { Users } from '../users/Entyties/users.entity';
import { Appointment } from './entities/appointment.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, VisitSlot, Appointment, Users]),
    AuthsModule,
    MailModule,
  ],
  providers: [VisitsService],
  controllers: [VisitsController],
  exports: [VisitsService, TypeOrmModule],
})
export class VisitsModule {}
