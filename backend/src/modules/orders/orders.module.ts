import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetails.entity';
import { Users } from '../users/Entyties/users.entity';
import { Product } from '../products/entities/products.entity';
import { Product_size } from '../products/entities/products_size.entity';
import { AuthsModule } from '../auths/auths.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetail,
      Users,
      Product,
      Product_size,
    ]),
    forwardRef(() => AuthsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
