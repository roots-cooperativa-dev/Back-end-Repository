import { Injectable, Logger } from '@nestjs/common';
import { IPaymentService } from '../payments/interface/patment.interface';
import { MercadoPagoService } from '../payments/mercadopago.service';
import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
  WebhookNotificationDto,
} from '../payments/dto/create-payment.dto';
import { Repository } from 'typeorm';
import { OrderPayment } from './entities/order-payment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderPaymentsService implements IPaymentService {
  private readonly logger = new Logger(OrderPaymentsService.name);
  private processedWebhooks = new Set<string>();
  private readonly WEBHOOK_TTL = 60000;

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    @InjectRepository(OrderPayment)
    private readonly orderPaymentsRespositorie: Repository<OrderPayment>,
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

        const orederPaymentsAppreved = this.orderPaymentsRespositorie.create({
          id: paymentInfo.id.toString(),
          userId: paymentInfo.external_reference,
          amount: paymentInfo.transaction_amount,
          currency: paymentInfo.currency_id,
          status: paymentInfo.status,
          statusDetail: paymentInfo.status_detail,
          paymentTypeId: paymentInfo.payment_type_id,
          paymentMethodId: paymentInfo.payment_method_id,
          dateApproved: paymentInfo.date_approved,
        });

        await this.orderPaymentsRespositorie.save(orederPaymentsAppreved);

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
