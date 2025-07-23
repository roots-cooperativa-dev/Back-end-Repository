import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDTO, UpdateProductDTO } from './DTO/CreateProduct.dto';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import { ProductFilterDTO } from './DTO/ProductFilter.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({
    summary: 'Retrieve all available products with optional filters',
  })
  @ApiQuery({ name: 'page', required: true })
  @ApiQuery({ name: 'limit', required: true })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price for product search',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price for product search',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Category ID to filter products',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Keyword to search in product names or details',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all products',
  })
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() filters: ProductFilterDTO) {
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      categoryId,
      name,
    } = filters;

    return await this.productsService.findAll(
      page,
      limit,
      minPrice,
      maxPrice,
      categoryId,
      name,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with sizes' })
  @ApiBody({ type: CreateProductDTO })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore soft-deleted product by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Product restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not deleted',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post('restore/:id')
  async restore(@Param('id') id: string) {
    return await this.productsService.restoreProduct(id);
  }
}
