import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Users } from 'src/modules/users/Entyties/users.entity';
import { Cart } from 'src/modules/orders/entities/cart.entity';

@Entity('order-payments')
export class OrderPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  pagoId: string;

  @Column()
  status: string;

  @Column()
  statusDetail: string;

  @Column('float')
  amount: number;

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

  @OneToOne(() => Cart, (cart) => cart.orderPayments)
  @JoinColumn()
  cart: Cart;

  @CreateDateColumn()
  createdAt: Date;
}
