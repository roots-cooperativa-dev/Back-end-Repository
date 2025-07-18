import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Visit } from './visit.entity';
import { Appointment } from 'src/modules/visits/entities/appointment.entity';

@Entity('visit_slots')
@Index(['date', 'startTime', 'visitId'], { unique: true })
export class VisitSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'boolean', default: false })
  isBooked: boolean;

  @Column({ type: 'int', default: 1 })
  maxAppointments: number;

  @Column({ type: 'int', default: 0 })
  currentAppointmentsCount: number;

  @Column({ type: 'uuid' })
  visitId: string;

  @ManyToOne(() => Visit, (visit) => visit.availableSlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'visitId' })
  visit: Visit;

  @OneToMany(() => Appointment, (appointment) => appointment.visitSlot)
  appointments: Appointment[];
}
