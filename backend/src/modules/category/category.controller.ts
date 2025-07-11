import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from './DTO/category.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() dto: CreateCategoryDTO) {
    return this.categoryService.createCategory(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  findAll() {
    return this.categoryService.findAllCategory();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDTO) {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  delete(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
