import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product_size } from './products_size.entity';

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

  @OneToMany(() => Product_size, (size) => size.product, { cascade: true })
  sizes: Product_size[];
}
