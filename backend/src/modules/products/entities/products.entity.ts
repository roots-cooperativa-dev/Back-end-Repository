import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product_size } from './products_size.entity';
import { Category } from 'src/modules/category/entity/category.entity';
import { File } from 'src/modules/file-upload/entity/file-upload.entity';
import { OrderDetail } from 'src/modules/orders/entities/orderDetails.entity';

@Entity({
  name: 'products',
})
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  details: string;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_Id' })
  category: Category;

  @OneToMany(() => Product_size, (size) => size.product, { cascade: true })
  sizes: Product_size[];

  @OneToMany(() => File, (file) => file.product, { cascade: true })
  files: File[];

  @ManyToMany(() => OrderDetail, (orderDetail) => orderDetail.products)
  orderDetails: OrderDetail[];
}
