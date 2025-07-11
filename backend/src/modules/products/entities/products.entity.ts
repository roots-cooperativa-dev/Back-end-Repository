import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product_size } from './products_size.entity';
import { Category } from 'src/modules/category/entity/category.entity';

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

  @Column({ default: false })
  isDeleted: boolean;

  @Column()
  category_Id: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_Id' })
  category: Category;

  @OneToMany(() => Product_size, (size) => size.product, { cascade: true })
  sizes: Product_size[];
}
