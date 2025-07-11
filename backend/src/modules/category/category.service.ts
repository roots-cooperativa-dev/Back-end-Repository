import { Injectable, NotFoundException } from '@nestjs/common';
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
    const category = this.categoryRepository.create(dto);
    return await this.categoryRepository.save(category);
  }

  async findAllCategory(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category ${id} not found`);

    this.categoryRepository.merge(category, dto);
    return await this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const result = await this.categoryRepository.delete(id);
    if (!result.affected)
      throw new NotFoundException(`Category ${id} not found`);
    return { message: `Category ${id} deleted.` };
  }
}
