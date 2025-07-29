import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IPaymentService,
  WebhookNotificationDto,
  MercadoPagoPaymentInfo,
} from '../payments/interface/patment.interface';
import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
} from '../payments/dto/create-payment.dto';
import { MercadoPagoService } from '../payments/mercadopago.service';
import { OrderPayment } from './entities/order-payment.entity';
import { Cart } from '../orders/entities/cart.entity';
import { MailService } from '../mail/mail.service';
import { Users } from '../users/Entyties/users.entity';

@Injectable()
export class OrderPaymentsService implements IPaymentService {
  private readonly logger = new Logger(OrderPaymentsService.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    @InjectRepository(OrderPayment)
    private readonly orderPaymentsRepository: Repository<OrderPayment>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly mailService: MailService,
    @InjectRepository(Users)
    private readonly userRespository: Repository<Users>,
  ) {}

  async createPreference(
    userId: string,
    dto: CreatePreferenceDto & { cartId: string },
  ): Promise<PreferenceResponseDto> {
    const cart = await this.cartRepository.findOne({
      where: { id: dto.cartId, user: { id: userId } },
      relations: ['user'],
    });

    if (!cart) {
      throw new BadRequestException(
        `Cart with ID ${dto.cartId} not found or doesn't belong to user ${userId}`,
      );
    }

    const cartTotal = Number(cart.total);
    const dtoAmount = Number(dto.amount);
    if (cartTotal !== dtoAmount) {
      throw new BadRequestException(
        `Amount mismatch: Cart total is ${cartTotal}, but received amount is ${dtoAmount}`,
      );
    }

    return this.mercadoPagoService.createCartPreference(
      userId,
      dto.cartId,
      dto,
    );
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    return this.mercadoPagoService.getPaymentStatus(paymentId);
  }

  async handleWebhook(notification: WebhookNotificationDto): Promise<void> {
    this.logger.warn(
      'handleWebhook called directly on OrderPaymentsService - should use WebhookRouterService',
    );
    const paymentInfo =
      await this.mercadoPagoService.processWebhook(notification);
    if (paymentInfo) {
      await this.processPaymentInfo(paymentInfo);
    }
  }

  async processPaymentInfo(paymentInfo: MercadoPagoPaymentInfo): Promise<void> {
    try {
      if (paymentInfo.status === 'approved') {
        if (!paymentInfo.external_reference) {
          this.logger.error('Payment approved but no external_reference found');
          return;
        }

        if (!paymentInfo.external_reference.startsWith('cart-')) {
          this.logger.error(
            `Invalid external_reference format for cart payment: ${paymentInfo.external_reference}`,
          );
          return;
        }

        const cartId = paymentInfo.external_reference.replace('cart-', '');

        const cart = await this.cartRepository.findOne({
          where: { id: cartId },
          relations: ['user'],
        });

        if (!cart) {
          this.logger.error(`Cart with ID ${cartId} not found`);
          return;
        }

        const orderPayment = this.orderPaymentsRepository.create({
          pagoId: paymentInfo.id.toString(),
          status: paymentInfo.status,
          statusDetail: paymentInfo.status_detail,
          amount: paymentInfo.transaction_amount,
          currencyId: paymentInfo.currency_id,
          paymentTypeId: paymentInfo.payment_type_id,
          paymentMethodId: paymentInfo.payment_method_id,
          dateApproved: new Date(paymentInfo.date_approved),
          user: cart.user,
          cart: cart,
        });

        await this.orderPaymentsRepository.save(orderPayment);

        await this.sendOrderPaymentNotificationAsync(cart.user.id);

        this.logger.log(
          `Order payment completed and saved for cart: ${cartId}, payment: ${paymentInfo.id}, user: ${cart.user.id}`,
        );
      } else {
        this.logger.log(
          `Order payment not approved - Status: ${paymentInfo.status}, Payment: ${paymentInfo.id}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing order payment: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getPaymentByCartId(cartId: string): Promise<OrderPayment | null> {
    return await this.orderPaymentsRepository.findOne({
      where: { cart: { id: cartId } },
      relations: ['user', 'cart'],
    });
  }

  async getPaymentsByUserId(userId: string): Promise<OrderPayment[]> {
    return await this.orderPaymentsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'cart'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllOrdersPayment(): Promise<OrderPayment[]> {
    return this.orderPaymentsRepository.find();
  }

  private async sendOrderPaymentNotificationAsync(id: string): Promise<void> {
    const user = await this.userRespository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(
        `Usuario con ID ${id} no encontrado para notificación de orden`,
      );
      return;
    }

    this.mailService
      .sendPurchaseConfirmation(user.email)
      .then(() => {
        this.logger.log(
          `Correo de notificación de compra enviado a ${user.email}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Error enviando notificación de compra a ${user.email}:`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }
}
