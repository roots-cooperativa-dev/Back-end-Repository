import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Product_size } from './entities/products_size.entity';
import { Category } from '../category/entity/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Product_size, Category])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
