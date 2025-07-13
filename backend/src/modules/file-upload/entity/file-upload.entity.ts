import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from '../../products/entities/products.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  mimeType: string;

  @ManyToOne(() => Product, (product) => product.files, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  product: Product;
}
