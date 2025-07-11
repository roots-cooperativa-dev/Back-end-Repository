import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './products.entity';

export enum SizeEnum {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

@Entity({
  name: 'products_size',
})
export class Product_size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SizeEnum })
  size: SizeEnum;

  @Column()
  price: number;

  @Column({ type: 'int', nullable: false })
  stock: number;

  @Column()
  product_Id: string;

  @ManyToOne(() => Product, (product) => product.sizes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
