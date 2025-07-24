import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Users } from '../users/Entyties/users.entity';
import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
} from './dto/create-payment.dto';
import {
  isMercadoPagoError,
  MercadoPagoPaymentInfo,
  WebhookNotificationDto,
} from './interface/patment.interface';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');

    if (!accessToken) {
      throw new Error('MP_ACCESS_TOKEN is required but not provided');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(
    userId: string,
    dto: CreatePreferenceDto,
  ): Promise<PreferenceResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.warn(`User with ID ${userId} not found`);
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    const preferenceData = {
      items: [
        {
          id: `donation-${user.id}`,
          title: 'Dononacion a ROOTS',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: dto.amount,
        },
      ],
      back_urls: {
        success: 'https://tusitio.com/success',
        failure: 'https://tusitio.com/failure',
        pending: 'https://tusitio.com/pending',
      },
      auto_return: 'approved',
      notification_url: `https://aad887979793.ngrok-free.app/payments/webhook`,
      external_reference: user.id,
    };

    try {
      const response = await this.preference.create({ body: preferenceData });

      this.logger.log(
        `Payment preference created: ${response.id} for user: ${userId}`,
      );

      return {
        preferenceId: response.id!,
        initPoint: response.init_point!,
        sandboxInitPoint: response.sandbox_init_point!,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error creating payment preference for user ${userId}: ${message}`,
      );
      throw new BadRequestException('Failed to create payment preference');
    }
  }

  async processWebhook(
    notification: unknown,
  ): Promise<MercadoPagoPaymentInfo | null> {
    try {
      if (!notification || typeof notification !== 'object') {
        this.logger.warn('Invalid webhook notification format received');
        return null;
      }

      const notif = notification as WebhookNotificationDto;

      if (!notif.type || !notif.data?.id) {
        this.logger.warn('Webhook notification missing required fields:', {
          type: notif.type,
          dataId: notif.data?.id,
        });
        return null;
      }

      if (notif.type === 'payment') {
        const paymentId = notif.data.id;
        this.logger.log(`Processing payment webhook for ID: ${paymentId}`);

        // Primer delay inicial
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const paymentInfo = await this.getPaymentInfoWithRetry(
          paymentId,
          6,
          3000,
        );

        if (!paymentInfo) {
          this.logger.warn(
            `❌ Payment info for ID ${paymentId} could not be retrieved after retries.`,
          );
          return null;
        }

        return paymentInfo;
      }

      this.logger.log(`Ignoring webhook of type: ${notif.type}`);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing webhook: ${message}`, stack);
      return null;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    try {
      const paymentInfo = await this.getPaymentInfo(paymentId);
      return {
        id: paymentInfo.id,
        status: paymentInfo.status,
        status_detail: paymentInfo.status_detail,
        transaction_amount: paymentInfo.transaction_amount,
        currency_id: paymentInfo.currency_id,
        date_approved: paymentInfo.date_approved,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting payment status: ${message}`);
      throw new BadRequestException('Failed to get payment status');
    }
  }

  private async getPaymentInfo(
    paymentId: string,
  ): Promise<MercadoPagoPaymentInfo> {
    try {
      this.logger.log(`Fetching payment info for ID: ${paymentId}`);

      const paymentResponse = await this.payment.get({ id: paymentId });

      this.logger.debug(`Payment response: ${JSON.stringify(paymentResponse)}`);

      return paymentResponse as MercadoPagoPaymentInfo;
    } catch (error) {
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
        this.logger.error(`MercadoPago API Error: ${error.message}`);
      } else {
        // Para objetos de error, usar JSON.stringify para obtener el contenido
        errorMessage = JSON.stringify(error);
        this.logger.error(
          `MercadoPago API Error (Object): ${JSON.stringify(error)}`,
        );
      }

      if (isMercadoPagoError(error)) {
        const responseData = error.response?.data as { message?: string };

        if (responseData?.message === 'payment not found') {
          this.logger.warn(
            `Payment not found for ID: ${paymentId} (may be a delay in MP processing)`,
          );
        }

        if (error.response?.data) {
          this.logger.error(
            `MercadoPago API Response: ${JSON.stringify(error.response.data)}`,
          );
        }

        if (error.status) {
          this.logger.error(`MercadoPago HTTP Status: ${error.status}`);
        }
      }

      this.logger.error(`Error fetching payment info: ${errorMessage}`);

      throw new BadRequestException(
        `Failed to fetch payment information: ${errorMessage}`,
      );
    }
  }

  private async getPaymentInfoWithRetry(
    paymentId: string,
    maxRetries: number = 3,
    delayMs: number = 2000,
  ): Promise<MercadoPagoPaymentInfo | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Fetching payment info for ID: ${paymentId} (attempt ${attempt}/${maxRetries})`,
        );
        return await this.getPaymentInfo(paymentId);
      } catch (error) {
        const isPaymentNotFound =
          error instanceof BadRequestException &&
          error.message.includes('Failed to fetch payment information');

        if (isPaymentNotFound && attempt < maxRetries) {
          this.logger.warn(
            `Payment info not found on attempt ${attempt}/${maxRetries}, retrying in ${delayMs}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        if (isPaymentNotFound) {
          this.logger.warn(
            `Payment info not available after ${maxRetries} retries. Skipping.`,
          );
          return null;
        }

        throw error;
      }
    }

    return null;
  }
}
