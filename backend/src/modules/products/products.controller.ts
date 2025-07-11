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
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Product } from './entities/products.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available products' })
  @ApiResponse({ status: 200, type: [Product] })
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product with its sizes' })
  @ApiBody({ type: CreateProductDTO })
  @ApiResponse({ status: 201, type: Product })
  create(@Body() dto: CreateProductDTO) {
    return this.productsService.createProduct(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by its ID (includes size and category)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: Product })
  findOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Partially update a product by ID (any field or size)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProductDTO })
  update(@Param('id') id: string, @Body() dto: UpdateProductDTO) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Logically delete a product by its ID' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
