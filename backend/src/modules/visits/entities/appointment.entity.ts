import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { VisitSlot } from './visit-slot.entity';
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  bookedAt: Date;

  @Column({ type: 'int', default: 1 })
  numberOfPeople: number;

  @Column()
  visitSlotId: string;

  @ManyToOne(() => VisitSlot, (visitSlot) => visitSlot.appointments, {
    onDelete: 'RESTRICT',
  })
  visitSlot: VisitSlot;
}
