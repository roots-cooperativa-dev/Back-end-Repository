import { Address } from 'src/modules/users/Entyties/address.entity';
import { Donate } from 'src/modules/donations/entities/donation.entity';
import { Cart } from 'src/modules/orders/entities/cart.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Appointment } from 'src/modules/visits/entities/appointment.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'users',
})
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  email: string;

  @Column({ type: 'date', nullable: false })
  birthdate: Date;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'bigint', nullable: false })
  phone: number;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'boolean', default: false })
  isSuperAdmin: boolean;

  @Column({ type: 'boolean', default: false })
  isDonator: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt: Date | null;

  @OneToMany(() => Donate, (donate) => donate.user)
  donates: Donate[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToOne(() => Address, (address) => address.user, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  @JoinColumn()
  address: Address;
}
