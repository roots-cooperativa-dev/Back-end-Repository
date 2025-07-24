import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { Product } from '../products/entities/products.entity';
import { UpdateOrderStatusDTO } from './DTO/updateOrderStatus.dto';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetails.entity';
import { Users } from 'src/modules/users/Entyties/users.entity';
import { Product_size } from 'src/modules/products/entities/products_size.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cartItem.entity';
import { UpdateCartItemDTO } from './DTO/updateCartItem.dto';
import { AddToCartDTO } from './DTO/addToCart.dto';
import { MailService } from '../mail/mail.service';

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

    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,

    private dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}
  async getUserOrders(
    userId: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<Order[]> {
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.orderDetail', 'orderDetail')
        .leftJoinAndSelect('orderDetail.products', 'products')
        .leftJoinAndSelect('products.sizes', 'sizes')
        .where('user.id = :userId', { userId });

      if (status) {
        query.andWhere('order.status = :status', { status });
      }

      query.orderBy('order.date', 'DESC');
      query.skip((page - 1) * limit).take(limit);

      const orders = await query.getMany();
      return orders;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Could not fetch orders for this user',
      );
    }
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'items', 'items.product', 'items.productSize'],
    });

    if (!cart) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      cart = this.cartRepository.create({ user, total: 0 });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'items', 'items.product', 'items.productSize'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart not found for user ID ${userId}`);
    }
    return cart;
  }

  async addProductToCart(userId: string, dto: AddToCartDTO): Promise<Cart> {
    const { productId, productSizeId, quantity } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let cart: Cart | null = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['user', 'items', 'items.product', 'items.productSize'],
      });

      if (!cart) {
        const user = await queryRunner.manager.findOne(Users, {
          where: { id: userId },
        });
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        cart = queryRunner.manager.create(Cart, { user, total: 0 });
        await queryRunner.manager.save(cart);
      }

      if (!cart.items) {
        cart.items = [];
      }

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const productSize = await queryRunner.manager.findOne(Product_size, {
        where: { id: productSizeId, product: { id: productId } },
      });
      if (!productSize) {
        throw new NotFoundException(
          `Product size with ID ${productSizeId} not found for product ${productId}`,
        );
      }

      let cartItem = cart.items.find(
        (item) =>
          item.product.id === productId &&
          item.productSize.id === productSizeId,
      );

      let newQuantity = quantity;
      if (cartItem) {
        newQuantity = cartItem.quantity + quantity;
      }

      if (productSize.stock < newQuantity) {
        throw new BadRequestException(
          `Not enough stock for ${product.name} (size: ${productSize.size}). Desired quantity: ${newQuantity}, Available: ${productSize.stock}`,
        );
      }

      const itemPrice = Number(productSize.price);
      if (isNaN(itemPrice)) {
        throw new InternalServerErrorException(
          'Product price is not a valid number.',
        );
      }

      if (cartItem) {
        cartItem.quantity = newQuantity;
        cartItem.subtotal = parseFloat(
          (newQuantity * Number(cartItem.priceAtAddition)).toFixed(2),
        );
      } else {
        cartItem = queryRunner.manager.create(CartItem, {
          cart,
          product,
          productSize,
          quantity,
          priceAtAddition: itemPrice,
          subtotal: parseFloat((quantity * itemPrice).toFixed(2)),
        });
        cart.items.push(cartItem);
      }

      await queryRunner.manager.save(cartItem);

      cart.total = parseFloat(
        cart.items
          .reduce((sum, item) => sum + Number(item.subtotal), 0)
          .toFixed(2),
      );

      await queryRunner.manager.save(cart);

      await queryRunner.commitTransaction();
      return this.getCart(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Could not add product to cart');
    } finally {
      await queryRunner.release();
    }
  }

  async updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDTO,
  ): Promise<Cart> {
    const { quantity } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'items.productSize'],
      });

      if (!cart) {
        throw new NotFoundException(`Cart not found for user ID ${userId}`);
      }

      if (!cart.items) {
        cart.items = [];
      }

      const cartItemIndex = cart.items.findIndex(
        (item) => item.id === cartItemId,
      );

      if (cartItemIndex === -1) {
        throw new NotFoundException(
          `Cart item with ID ${cartItemId} not found in your cart`,
        );
      }

      const cartItem = cart.items[cartItemIndex];

      if (!cartItem) {
        throw new NotFoundException(
          `Cart item with ID ${cartItemId} not found in your cart`,
        );
      }

      if (quantity === 0) {
        await queryRunner.manager.remove(cartItem);
        cart.items.splice(cartItemIndex, 1);
      } else {
        const productSize = await queryRunner.manager.findOne(Product_size, {
          where: { id: cartItem.productSize.id },
        });

        if (!productSize) {
          throw new NotFoundException(
            `Associated product size not found for cart item ${cartItemId}`,
          );
        }

        if (productSize.stock < quantity) {
          throw new BadRequestException(
            `Not enough stock for ${cartItem.product.name} (size: ${productSize.size}). Desired quantity: ${quantity}, Available: ${productSize.stock}`,
          );
        }

        cartItem.quantity = quantity;
        cartItem.subtotal = parseFloat(
          (quantity * Number(cartItem.priceAtAddition)).toFixed(2),
        );
        await queryRunner.manager.save(cartItem);
      }

      cart.total = parseFloat(
        cart.items
          .reduce((sum, item) => sum + Number(item.subtotal), 0)
          .toFixed(2),
      );

      await queryRunner.manager.save(cart);

      await queryRunner.commitTransaction();
      return this.getCart(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Could not update cart item quantity',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async removeCartItem(userId: string, itemId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const itemToRemove = await queryRunner.manager.findOne(CartItem, {
        where: { id: itemId, cart: { user: { id: userId } } },
      });

      if (!itemToRemove) {
        throw new NotFoundException(
          `Cart item with ID ${itemId} not found in your cart or does not belong to your user.`,
        );
      }
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'items.productSize'],
      });

      if (!cart) {
        throw new NotFoundException('Cart not found for user');
      }

      if (!cart.items) {
        cart.items = [];
      }

      const itemToRemoveIndex = cart.items.findIndex(
        (item) => item.id === itemId,
      );

      if (itemToRemoveIndex === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      await queryRunner.manager.remove(itemToRemove);

      cart.items = cart.items.filter((item) => item.id !== itemId);
      cart.total = parseFloat(
        cart.items
          .reduce((sum, item) => sum + Number(item.subtotal), 0)
          .toFixed(2),
      );

      await queryRunner.manager.save(cart);

      await queryRunner.commitTransaction();
      return { message: 'Item removed from cart', cart };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Could not remove cart item');
    } finally {
      await queryRunner.release();
    }
  }

  async checkoutCart(userId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['user', 'items', 'items.product', 'items.productSize'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException(
          'Cart is empty. Cannot proceed with checkout.',
        );
      }

      const productEntitiesForOrderDetail: Product[] = [];
      const orderDetailProductsWithQuantity: {
        product: Product;
        quantity: number;
        priceAtAddition: number;
      }[] = [];
      let orderTotal = 0;

      for (const cartItem of cart.items) {
        const productSize = await queryRunner.manager.findOne(Product_size, {
          where: { id: cartItem.productSize.id },
        });

        if (!productSize || productSize.stock < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product: ${cartItem.product.name} (size: ${
              cartItem.productSize.size
            }). Available: ${productSize?.stock || 0}, Desired: ${
              cartItem.quantity
            }. Please update your cart.`,
          );
        }

        const itemPrice = Number(cartItem.priceAtAddition);
        if (isNaN(itemPrice)) {
          throw new InternalServerErrorException(
            `Product price for cart item ${cartItem.id} is not a valid number.`,
          );
        }

        orderTotal += cartItem.subtotal;

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: cartItem.product.id },
        });
        if (!product) {
          throw new InternalServerErrorException(
            `Product with ID ${cartItem.product.id} not found during checkout.`,
          );
        }
        productEntitiesForOrderDetail.push(product);
        orderDetailProductsWithQuantity.push({
          product,
          quantity: cartItem.quantity,
          priceAtAddition: itemPrice,
        });

        productSize.stock -= cartItem.quantity;
        await queryRunner.manager.save(productSize);
      }

      const newOrder = queryRunner.manager.create(Order, {
        user: cart.user,
        status: 'active',
      });
      const savedOrder = await queryRunner.manager.save(newOrder);

      const orderDetail = queryRunner.manager.create(OrderDetail, {
        order: savedOrder,
        products: productEntitiesForOrderDetail,
        total: parseFloat(orderTotal.toFixed(2)),
      });
      const savedDetail = await queryRunner.manager.save(orderDetail);

      savedOrder.orderDetail = savedDetail;
      await queryRunner.manager.save(savedOrder);

      await queryRunner.manager.remove(cart.items);

      cart.items = [];
      cart.total = 0;
      await queryRunner.manager.save(cart);

      await queryRunner.commitTransaction();
      try {
        await this.mailService.sendOrderProcessingNotification(
          cart.user.email,
          cart.user.name,
          savedOrder.id,
        );
      } catch (emailError) {
        console.error('Error sending order processing email:', emailError);
      }
      return this.getOrderById(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Could not complete checkout process',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderById(id: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: [
          'user',
          'orderDetail',
          'orderDetail.products',
          'orderDetail.products.sizes',
        ],
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
        relations: [
          'user',
          'orderDetail',
          'orderDetail.products',
          'orderDetail.products.sizes',
        ],
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user)
        throw new NotFoundException(`User with ID ${userId} not found`);

      let total = 0;
      const productEntities: Product[] = [];

      for (const item of products) {
        const product = await queryRunner.manager.findOne(Product, {
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
        await queryRunner.manager.save(size);
      }

      total = parseFloat(total.toFixed(2));

      const newOrder = queryRunner.manager.create(Order, { user });
      const savedOrder = await queryRunner.manager.save(newOrder);

      const orderDetail = queryRunner.manager.create(OrderDetail, {
        order: savedOrder,
        products: productEntities,
        total,
      });

      const savedDetail = await queryRunner.manager.save(orderDetail);
      savedOrder.orderDetail = savedDetail;
      await queryRunner.manager.save(savedOrder);

      await queryRunner.commitTransaction();

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
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create order');
    } finally {
      await queryRunner.release();
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
