import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { In, Repository } from 'typeorm';
import { Product_size } from './entities/products_size.entity';
import { CreateProductDTO, UpdateProductDTO } from './DTO/CreateProduct.dto';
import { Category } from '../category/entity/category.entity';
import { File } from '../file-upload/entity/file-upload.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Product_size)
    private readonly productSizeRepository: Repository<Product_size>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async createProduct(data: CreateProductDTO): Promise<Product> {
    const { name, details, category_Id, sizes, file_Ids } = data;

    const category = await this.categoryRepository.findOneBy({
      id: category_Id,
    });
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${category_Id} does not exist`,
      );
    }

    const files = await this.fileRepository.findByIds(file_Ids);
    if (files.length !== file_Ids.length) {
      throw new BadRequestException('One or more file IDs are invalid');
    }

    try {
      const newProduct = this.productRepository.create({
        name,
        details,
        category,
        files,
      });
      const savedProduct = await this.productRepository.save(newProduct);

      const sizesToSave = sizes.map((size) =>
        this.productSizeRepository.create({
          ...size,
          product: savedProduct,
        }),
      );
      await this.productSizeRepository.save(sizesToSave);

      return this.getProductById(savedProduct.id);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error creating product');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    minPrice?: number,
    maxPrice?: number,
    categoryId?: string,
    name?: string,
  ): Promise<Product[]> {
    try {
      const skip = (page - 1) * limit;

      const queryBuilder = this.productRepository.createQueryBuilder('product');

      queryBuilder
        .leftJoinAndSelect('product.sizes', 'product_size')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.files', 'file');

      queryBuilder.where('product.isDeleted = :isDeleted', {
        isDeleted: false,
      });

      if (name) {
        queryBuilder.andWhere(
          '(LOWER(product.name) LIKE LOWER(:name) OR LOWER(product.details) LIKE LOWER(:name))',
          { name: `%${name}%` },
        );
      }

      if (categoryId) {
        queryBuilder.andWhere('category.id = :categoryId', { categoryId });
      }

      if (minPrice !== undefined) {
        queryBuilder.andWhere('product_size.price >= :minPrice', { minPrice });
      }

      if (maxPrice !== undefined) {
        queryBuilder.andWhere('product_size.price <= :maxPrice', { maxPrice });
      }

      queryBuilder.skip(skip);
      queryBuilder.take(limit);

      queryBuilder.orderBy('product.name', 'ASC');

      return await queryBuilder.getMany();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error retrieving products with filters',
      );
    }
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['sizes', 'category', 'files'],
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    const product = await this.getProductById(id);

    if (data.category_Id !== undefined) {
      const category = await this.categoryRepository.findOneBy({
        id: data.category_Id,
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${data.category_Id} does not exist`,
        );
      }
      product.category = category;
    }

    if (data.file_Ids) {
      const files = await this.fileRepository.findBy({
        id: In(data.file_Ids),
      });
      if (files.length !== data.file_Ids.length) {
        throw new BadRequestException('One or more file IDs are invalid');
      }
      product.files = files;
    }

    if (data.name !== undefined) product.name = data.name;
    if (data.details !== undefined) product.details = data.details;

    try {
      await this.productRepository.save(product);

      if (data.sizes) {
        await this.productSizeRepository.delete({ product: { id } });
        const newSizes = data.sizes.map((size) =>
          this.productSizeRepository.create({ ...size, product }),
        );
        await this.productSizeRepository.save(newSizes);
      }
      return this.getProductById(id);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(`Error updating product ${id}`);
    }
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    try {
      const product = await this.getProductById(id);

      product.isDeleted = true;
      await this.productRepository.save(product);

      return { message: `Product ${id} successfully removed.` };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(`Error deleting product ${id}`);
    }
  }
}
