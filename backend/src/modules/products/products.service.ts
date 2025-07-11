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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Product_size)
    private readonly productSizeRepository: Repository<Product_size>,
  ) {}

  async createProduct(data: CreateProductDTO): Promise<Product> {
    try {
      const { name, details, sizes } = data;

      if (!sizes || sizes.length === 0) {
        throw new BadRequestException('At least one size must be provided.');
      }

      const newProduct = this.productRepository.create({ name, details });
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
        relations: ['sizes'],
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error retrieving products');
    }
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['sizes'],
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    try {
      const product = await this.getProductById(id);

      this.productRepository.merge(product, {
        name: data.name,
        details: data.details,
      });
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
