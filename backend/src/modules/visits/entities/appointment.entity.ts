import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { VisitSlot } from 'src/modules/visits/entities/visit-slot.entity';
import { Users } from 'src/modules/users/Entyties/users.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @CreateDateColumn()
  bookedAt: Date;

  @Column({ type: 'int', default: 1 })
  numberOfPeople: number;

  @Column({ type: 'uuid' })
  visitSlotId: string;

  @Column({ type: 'text' })
  description?: string;

  @ManyToOne(() => Users, (user) => user.appointments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user: Users;

  @ManyToOne(() => VisitSlot, (visitSlot) => visitSlot.appointments, {
    onDelete: 'RESTRICT',
  })
  visitSlot: VisitSlot;
}
