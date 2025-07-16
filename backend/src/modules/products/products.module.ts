import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Product_size } from './entities/products_size.entity';
import { Category } from '../category/entity/category.entity';
import { File } from '../file-upload/entity/file-upload.entity';
import { AuthsModule } from '../auths/auths.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Product_size, Category, File]),
    forwardRef(() => AuthsModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
