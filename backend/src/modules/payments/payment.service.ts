import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IPaymentService,
  PaymentCompletedEvent,
  WebhookNotificationDto,
} from './interface/patment.interface';
import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
} from './dto/create-payment.dto';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class PaymentsService implements IPaymentService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPreference(
    userId: string,
    dto: CreatePreferenceDto,
  ): Promise<PreferenceResponseDto> {
    try {
      this.logger.log(`Creating payment preference for user: ${userId}`);
      return await this.mercadoPagoService.createPreference(userId, dto);
    } catch (error) {
      this.logger.error(
        `Error creating preference: ${(error as Error).message || error}`,
      );
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    try {
      this.logger.log(`Getting payment status for: ${paymentId}`);
      return await this.mercadoPagoService.getPaymentStatus(paymentId);
    } catch (error) {
      this.logger.error(
        `Error getting payment status: ${(error as Error).message || error}`,
      );
      throw error;
    }
  }

  async handleWebhook(notification: WebhookNotificationDto): Promise<void> {
    try {
      this.logger.log(`Processing webhook: ${JSON.stringify(notification)}`);

      const paymentInfo =
        await this.mercadoPagoService.processWebhook(notification);

      if (paymentInfo && paymentInfo.status === 'approved') {
        const event: PaymentCompletedEvent = {
          paymentId: paymentInfo.id.toString(),
          userId: paymentInfo.external_reference,
          amount: paymentInfo.transaction_amount,
          currency: paymentInfo.currency_id,
          status: paymentInfo.status,
          statusDetail: paymentInfo.status_detail,
          paymentTypeId: paymentInfo.payment_type_id,
          paymentMethodId: paymentInfo.payment_method_id,
          dateApproved: paymentInfo.date_approved,
        };

        await this.eventEmitter.emitAsync('payment.completed', event);
        this.logger.log(
          `Payment completed event emitted for payment: ${paymentInfo.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing webhook: ${(error as Error).message || error}`,
      );
      throw error;
    }
  }
}
