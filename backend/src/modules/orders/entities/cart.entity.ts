import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from 'src/modules/users/Entyties/users.entity';
import { CartItem } from './cartItem.entity';
import { OrderPayment } from 'src/modules/order-payments/entities/order-payment.entity';

@Entity({
  name: 'carts',
})
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Users, (user) => user.cart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  items: CartItem[];

  @OneToOne(() => OrderPayment, (orderpayments) => orderpayments.cart)
  @JoinColumn()
  orderPayments: OrderPayment;
}
