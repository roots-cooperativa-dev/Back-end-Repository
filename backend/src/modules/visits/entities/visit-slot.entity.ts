import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Visit } from './visit.entity';
import { Appointment } from './appointment.entity';

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

  @Column()
  visitId: string;

  @ManyToOne(() => Visit, (visit) => visit.availableSlots, {
    onDelete: 'CASCADE',
  })
  visit: Visit;
  @OneToMany(() => Appointment, (appointment) => appointment.visitSlot)
  appointments: Appointment[];
}
