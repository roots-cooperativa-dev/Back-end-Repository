// src/modules/order-payments/order-payments.service.ts
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

@Injectable()
export class OrderPaymentsService implements IPaymentService {
  private readonly logger = new Logger(OrderPaymentsService.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    @InjectRepository(OrderPayment)
    private readonly orderPaymentsRepository: Repository<OrderPayment>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  async createPreference(
    userId: string,
    dto: CreatePreferenceDto & { cartId: string }, // Extendemos el DTO para incluir cartId
  ): Promise<PreferenceResponseDto> {
    // Validar que el carrito existe y pertenece al usuario
    const cart = await this.cartRepository.findOne({
      where: { id: dto.cartId, user: { id: userId } },
      relations: ['user'],
    });

    if (!cart) {
      throw new BadRequestException(
        `Cart with ID ${dto.cartId} not found or doesn't belong to user ${userId}`,
      );
    }

    // Crear preferencia usando el método específico para carritos
    return this.mercadoPagoService.createCartPreference(
      userId,
      dto.cartId,
      dto,
    );
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    return this.mercadoPagoService.getPaymentStatus(paymentId);
  }

  // Método legacy para mantener compatibilidad (NO SE DEBE USAR DIRECTAMENTE)
  async handleWebhook(notification: WebhookNotificationDto): Promise<void> {
    this.logger.warn(
      'handleWebhook called directly on OrderPaymentsService - should use WebhookRouterService',
    );
    // Este método se mantiene por compatibilidad pero se recomienda usar WebhookRouterService
    const paymentInfo =
      await this.mercadoPagoService.processWebhook(notification);
    if (paymentInfo) {
      await this.processPaymentInfo(paymentInfo);
    }
  }

  // Nuevo método para procesar información de pago (llamado por WebhookRouterService)
  async processPaymentInfo(paymentInfo: MercadoPagoPaymentInfo): Promise<void> {
    try {
      if (paymentInfo.status === 'approved') {
        if (!paymentInfo.external_reference) {
          this.logger.error('Payment approved but no external_reference found');
          return;
        }

        // Extraer cartId del external_reference
        if (!paymentInfo.external_reference.startsWith('cart-')) {
          this.logger.error(
            `Invalid external_reference format for cart payment: ${paymentInfo.external_reference}`,
          );
          return;
        }

        const cartId = paymentInfo.external_reference.replace('cart-', '');

        // Buscar el carrito y obtener información del usuario
        const cart = await this.cartRepository.findOne({
          where: { id: cartId },
          relations: ['user'],
        });

        if (!cart) {
          this.logger.error(`Cart with ID ${cartId} not found`);
          return;
        }

        // Verificar si ya existe un pago para este carrito
        const existingPayment = await this.orderPaymentsRepository.findOne({
          where: { cart: { id: cartId } },
        });

        if (existingPayment) {
          this.logger.warn(
            `Payment already exists for cart ${cartId}, skipping...`,
          );
          return;
        }

        // Crear registro de pago
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

  // Método auxiliar para obtener pagos por carrito
  async getPaymentByCartId(cartId: string): Promise<OrderPayment | null> {
    return this.orderPaymentsRepository.findOne({
      where: { cart: { id: cartId } },
      relations: ['user', 'cart'],
    });
  }

  // Método auxiliar para obtener pagos por usuario
  async getPaymentsByUserId(userId: string): Promise<OrderPayment[]> {
    return this.orderPaymentsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'cart'],
      order: { createdAt: 'DESC' },
    });
  }
}
