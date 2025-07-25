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
    return this.mercadoPagoService.createPreference(userId, dto);
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    return this.mercadoPagoService.getPaymentStatus(paymentId);
  }

  async handleWebhook(notification: WebhookNotificationDto): Promise<void> {
    const webhookKey = `${notification.type}_${notification.data?.id}_${notification.id}`;
    if (this.processedWebhooks.has(webhookKey)) {
      return;
    }
    this.processedWebhooks.add(webhookKey);
    setTimeout(
      () => this.processedWebhooks.delete(webhookKey),
      this.WEBHOOK_TTL,
    );

    try {
      const paymentInfo =
        await this.mercadoPagoService.processWebhook(notification);

      if (paymentInfo?.status === 'approved') {
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
          `Payment completed event emitted for payment: ${paymentInfo.id}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing webhook: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
