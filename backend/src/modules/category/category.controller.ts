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

import { CategoryService } from './category.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from './DTO/category.dto';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Retrieve all available categories' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of categories per page (default: 3)',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Search categories by partial name match (case-insensitive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all categories',
  })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 3,
    @Query('name') name?: string,
  ) {
    return await this.categoryService.findAllCategory(page, limit, name);
  }

  @ApiBearerAuth()
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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateCategoryDTO) {
    return await this.categoryService.createCategory(dto);
  }

  @ApiBearerAuth()
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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDTO) {
    return await this.categoryService.updateCategory(id, dto);
  }

  @ApiBearerAuth()
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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.categoryService.deleteCategory(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore soft-deleted category by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Category restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or not deleted',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post('restore/:id')
  async restore(@Param('id') id: string) {
    return await this.categoryService.restoreCategory(id);
  }
}
