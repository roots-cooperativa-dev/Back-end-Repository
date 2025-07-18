import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Users } from 'src/modules/users/Entyties/users.entity';

@Entity('donates')
export class Donate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  pagoId: string;

  @Column()
  status: string;

  @Column()
  statusDetail: string;

  @Column('float')
  amount: number; // Cambié transactionAmount a amount para que coincida con el DTO

  @Column()
  currencyId: string;

  @Column()
  paymentTypeId: string;

  @Column()
  paymentMethodId: string;

  @Column({ type: 'timestamp' })
  dateApproved: Date;

  @ManyToOne(() => Users, (user) => user.donates)
  @JoinColumn()
  user: Users;

  @CreateDateColumn()
  createdAt: Date;
}
