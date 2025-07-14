import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDTO, UpdateProductDTO } from './DTO/CreateProduct.dto';
import { Product } from './entities/products.entity';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Retrieve all available products' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all products',
    type: [Product],
  })
  @Get()
  async findAll() {
    return await this.productsService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with sizes' })
  @ApiBody({ type: CreateProductDTO })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product data provided',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateProductDTO) {
    return await this.productsService.createProduct(dto);
  }

  @ApiOperation({
    summary: 'Retrieve product by ID with size and category details',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved product with details',
    type: Product,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productsService.getProductById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product information by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
  })
  @ApiBody({ type: UpdateProductDTO })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product data provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDTO) {
    return await this.productsService.updateProduct(id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product by ID (soft delete)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productsService.deleteProduct(id);
  }
}
