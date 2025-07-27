import { forwardRef, Module } from '@nestjs/common';
import { OrderPaymentsService } from './order-payments.service';
import { OrderPaymentsController } from './order-payments.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercadoPagoService } from '../payments/mercadopago.service';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { Order } from '../orders/entities/order.entity';
import { Users } from '../users/Entyties/users.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Order, Users]),
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [OrderPaymentsController],
  providers: [OrderPaymentsService, MercadoPagoService],
  exports: [TypeOrmModule],
})
export class OrderPaymentsModule {}
