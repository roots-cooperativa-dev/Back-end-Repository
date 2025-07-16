import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/modules/products/entities/products.entity';

@Entity({
  name: 'orders_details',
})
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, nullable: false })
  total: number;

  @OneToOne(() => Order, (order) => order.orderDetail, { nullable: false })
  order: Order;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'order_details_products',
  })
  products: Product[];
}
