import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from '../products/entities/products.entity';
import { UpdateOrderStatusDTO } from './DTO/updateOrderStatus.dto';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetails.entity';
import { Users } from 'src/modules/users/Entyties/users.entity';
import { Product_size } from 'src/modules/products/entities/products_size.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Product_size)
    private readonly productSizeRepository: Repository<Product_size>,
  ) {}

  async getOrderById(id: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['user', 'orderDetail', 'orderDetail.products'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return order;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Could not fetch order');
    }
  }

  async getAllOrders(
    page = 1,
    limit = 10,
  ): Promise<{ data: Order[]; total: number }> {
    try {
      const [orders, total] = await this.orderRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['user', 'orderDetail', 'orderDetail.products'],
        order: { date: 'DESC' },
      });

      return { data: orders, total };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Could not fetch orders');
    }
  }

  async createOrder(
    userId: string,
    products: { product_id: string; size_id: string }[],
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user)
        throw new NotFoundException(`User with ID ${userId} not found`);

      let total = 0;
      const productEntities: Product[] = [];

      for (const item of products) {
        const product = await this.productRepository.findOne({
          where: { id: item.product_id },
          relations: ['sizes'],
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.product_id} not found`);
        }

        const size = product.sizes.find((s) => s.id === item.size_id);
        if (!size) {
          throw new NotFoundException(
            `Size ${item.size_id} not found in product ${product.name}`,
          );
        }

        if (size.stock <= 0) {
          throw new BadRequestException(
            `No stock for ${product.name} size ${size.size}`,
          );
        }

        total += Number(size.price);
        productEntities.push(product);

        size.stock -= 1;
        await this.productSizeRepository.save(size);
      }

      const newOrder = this.orderRepository.create({ user });
      const savedOrder = await this.orderRepository.save(newOrder);

      const orderDetail = this.orderDetailRepository.create({
        order: savedOrder,
        products: productEntities,
        total,
      });

      const savedDetail = await this.orderDetailRepository.save(orderDetail);
      savedOrder.orderDetail = savedDetail;

      return {
        id: savedOrder.id,
        date: savedOrder.date,
        order_status: savedOrder.status,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
        orderDetail: {
          id: savedDetail.id,
          total: savedDetail.total,
          products: productEntities.map((product) => ({
            id: product.id,
            name: product.name,
            details: product.details,
            size: product.sizes,
          })),
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not create order');
    }
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDTO): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.status = dto.status;
    return this.orderRepository.save(order);
  }
}
