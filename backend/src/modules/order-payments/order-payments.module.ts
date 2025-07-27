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
import { PaymentsModule } from '../payments/payment.module';
import { WebhookRouterService } from '../payments/webhooks-router.service';
import { OrdersService } from '../orders/orders.service';
import { OrderPayment } from './entities/order-payment.entity';
import { Cart } from '../orders/entities/cart.entity';
import { MailModule } from '../mail/mail.module';
import { AuthsModule } from '../auths/auths.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([OrderPayment, Order, Users, Cart]),
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => AuthsModule),
    MailModule,
  ],
  controllers: [OrderPaymentsController],
  providers: [
    OrderPaymentsService,
    MercadoPagoService,
    WebhookRouterService,
    OrdersService,
  ],
  exports: [OrderPaymentsService, TypeOrmModule],
})
export class OrderPaymentsModule {}
