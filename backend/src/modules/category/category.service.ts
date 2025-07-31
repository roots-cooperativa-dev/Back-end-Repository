import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDTO, UpdateCategoryDTO } from './DTO/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createCategory(dto: CreateCategoryDTO): Promise<Category> {
    try {
      const existingCategory = await this.categoryRepository
        .createQueryBuilder('category')
        .withDeleted()
        .where('LOWER(category.name) = LOWER(:name)', { name: dto.name })
        .getOne();

      if (existingCategory) {
        throw new BadRequestException(
          `Ya existe una categoría con el nombre '${dto.name}'`,
        );
      }

      const category = this.categoryRepository.create(dto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to create category');
    }
  }

  async findAllCategory(
    page: number,
    limit: number,
    name?: string,
  ): Promise<{ categories: Category[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .withDeleted()
        .addSelect('category.deleted_at')
        .take(limit)
        .skip(skip);

      if (name) {
        queryBuilder.where('category.name ILIKE :name', {
          name: `%${name}%`,
        });
      }

      const [categories, total] = await queryBuilder.getManyAndCount();

      const pages = Math.ceil(total / limit);

      return { categories, total, pages };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch categories');
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOneBy({ id });
      if (!category) throw new NotFoundException(`Category ${id} not found`);

      this.categoryRepository.merge(category, dto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Failed to update category ${id}`);
    }
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    try {
      const result = await this.categoryRepository.softDelete(id);
      if (!result.affected)
        throw new NotFoundException(`Category ${id} not found`);
      return { message: `Category ${id} deleted.` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Failed to delete category ${id}`);
    }
  }

  async restoreCategory(id: string): Promise<{ message: string }> {
    try {
      const result = await this.categoryRepository.restore(id);
      if (!result.affected) {
        throw new NotFoundException(`Category ${id} not found or not deleted`);
      }
      return { message: `Category ${id} restored.` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to restore category ${id}`,
      );
    }
  }
}
