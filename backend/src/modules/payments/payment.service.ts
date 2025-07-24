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
  private processedWebhooks = new Set<string>();
  private readonly WEBHOOK_TTL = 60000;

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating preference: ${errorMessage}`);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    try {
      this.logger.log(`Getting payment status for: ${paymentId}`);
      return await this.mercadoPagoService.getPaymentStatus(paymentId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting payment status: ${errorMessage}`);
      throw error;
    }
  }

  async handleWebhook(notification: WebhookNotificationDto): Promise<void> {
    try {
      this.logger.log(`Processing webhook notification`);

      const webhookKey = `${notification.type}_${notification.data?.id}_${notification.id}`;

      if (this.processedWebhooks.has(webhookKey)) {
        this.logger.log(`Webhook ${webhookKey} already processed, skipping`);
        return;
      }

      this.processedWebhooks.add(webhookKey);

      setTimeout(() => {
        this.processedWebhooks.delete(webhookKey);
      }, this.WEBHOOK_TTL);

      this.logger.debug(
        `Webhook type: ${notification.type}, ID: ${notification.data?.id}`,
      );

      const paymentInfo =
        await this.mercadoPagoService.processWebhook(notification);

      if (paymentInfo && paymentInfo.status === 'approved') {
        if (!paymentInfo.external_reference) {
          this.logger.error('Payment approved but no external_reference found');
          return;
        }

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
          `✅ Payment completed event emitted for payment: ${paymentInfo.id}`,
        );
      } else {
        this.logger.log(
          `Payment status: ${paymentInfo?.status || 'unknown'} - No event emitted`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `❌ Error processing webhook: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
