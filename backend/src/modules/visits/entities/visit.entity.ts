import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { VisitSlot } from './visit-slot.entity';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  people: number;

  @Column({ default: 'active' })
  status: string;

  @OneToMany(() => VisitSlot, (visitSlot) => visitSlot.visit)
  availableSlots: VisitSlot[];
}
