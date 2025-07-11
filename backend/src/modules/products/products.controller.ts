import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDTO, UpdateProductDTO } from './DTO/CreateProduct.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateProductDTO) {
    return this.productsService.createProduct(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDTO) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
