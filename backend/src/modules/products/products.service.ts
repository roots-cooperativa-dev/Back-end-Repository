import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Repository } from 'typeorm';
import { Product_size } from './entities/products_size.entity';
import { CreateProductDTO, UpdateProductDTO } from './DTO/CreateProduct.dto';
import { Category } from '../category/entity/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Product_size)
    private readonly productSizeRepository: Repository<Product_size>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createProduct(data: CreateProductDTO): Promise<Product> {
    const { name, details, category_Id, sizes } = data;

    const category = await this.categoryRepository.findOneBy({
      id: category_Id,
    });
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${category_Id} does not exist`,
      );
    }

    try {
      const newProduct = this.productRepository.create({
        name,
        details,
        category_Id,
      });
      const savedProduct = await this.productRepository.save(newProduct);

      const sizesToSave = sizes.map((size) =>
        this.productSizeRepository.create({
          ...size,
          product_Id: savedProduct.id,
        }),
      );
      await this.productSizeRepository.save(sizesToSave);

      return this.getProductById(savedProduct.id);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error creating product');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productRepository.find({
        where: { isDeleted: false },
        relations: ['sizes', 'category'],
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error retrieving products');
    }
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['sizes', 'category'],
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
    }

    try {
      if (data.name !== undefined) product.name = data.name;
      if (data.details !== undefined) product.details = data.details;
      if (data.category_Id !== undefined)
        product.category_Id = data.category_Id;

      await this.productRepository.save(product);

      if (data.sizes) {
        await this.productSizeRepository.delete({ product_Id: id });
        const newSizes = data.sizes.map((size) =>
          this.productSizeRepository.create({ ...size, product_Id: id }),
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
