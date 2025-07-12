import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CategoryService } from './category.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from './DTO/category.dto';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Retrieve all available categories' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all categories',
  })
  @Get()
  async findAll() {
    return await this.categoryService.findAllCategory();
  }

  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDTO })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category data provided',
  })
  @Post()
  async create(@Body() dto: CreateCategoryDTO) {
    return await this.categoryService.createCategory(dto);
  }

  @ApiOperation({ summary: 'Update category information by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category unique identifier',
  })
  @ApiBody({ type: UpdateCategoryDTO })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category data provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDTO) {
    return await this.categoryService.updateCategory(id, dto);
  }

  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.categoryService.deleteCategory(id);
  }
}
