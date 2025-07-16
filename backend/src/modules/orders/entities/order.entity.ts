import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderDetail } from './orderDetails.entity';
import { Users } from 'src/modules/users/Entyties/users.entity';

@Entity({
  name: 'orders',
})
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'cancelled', 'processed', 'finalized'],
    default: 'active',
  })
  status: string;

  @OneToOne(() => OrderDetail, (orderDetails) => orderDetails.order)
  @JoinColumn()
  orderDetail: OrderDetail;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
