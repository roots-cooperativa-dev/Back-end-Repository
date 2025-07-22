import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
  MercadoPagoPaymentInfo,
  WebhookNotificationDto,
} from './interface/patment.interface';

type MercadoPagoApiError = Error & {
  cause?: unknown;
  response?: {
    body?: unknown;
  };
};

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
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get<string>('MP_ACCESS_TOKEN') || '',
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
    const amount = Number(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid donation amount');
    }

    const preferenceData = {
      items: [
        {
          id: `donation-${userId}`,
          title: 'Donation to ROOTS',
          description: dto.message || 'Voluntary donation',
          unit_price: Number(dto.amount),
          quantity: 1,
          currency_id: (dto.currency || 'ARS').trim().toUpperCase(),
        },
      ],
      back_urls: {
        success: `${this.configService.get<string>('FRONTEND_MP_URL')}/donation/success`,
        failure: `${this.configService.get<string>('FRONTEND_MP_URL')}/donation/failure`,
        pending: `${this.configService.get<string>('FRONTEND_MP_URL')}/donation/pending`,
      },
      auto_return: 'approved' as const,
      notification_url: `${this.configService.get<string>('BACKEND_MP_URL')}/payments/webhook`,
      external_reference: userId,
      payment_methods: {
        excluded_payment_types: [{ id: 'atm' }],
        installments: 12,
      },
    };

    this.logger.error(
      'Failed preference data:',
      JSON.stringify(preferenceData, null, 2),
    );

    try {
      const response = await this.preference.create({ body: preferenceData });

      if (!response.id || !response.init_point) {
        throw new InternalServerErrorException(
          'Invalid response from MercadoPago',
        );
      }

      this.logger.log(
        `✅ Payment preference created: ${response.id} for user: ${userId}`,
      );

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point || response.init_point,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error instanceof Error) {
        const typedError = error as MercadoPagoApiError;
        this.logger.error('MercadoPago API Error:', {
          message: typedError.message,
          cause: typedError.cause,
          body: typedError.response?.body,
        });
      } else {
        this.logger.error(`MercadoPago API Error: ${String(error)}`);
      }

      throw new InternalServerErrorException(
        'Payment service temporarily unavailable',
      );
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
        return await this.getPaymentInfo(paymentId);
      }

      this.logger.log(`Ignoring webhook of type: ${notif.type}`);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing webhook: ${message}`);

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
      const paymentResponse = await this.payment.get({ id: paymentId });
      return paymentResponse as MercadoPagoPaymentInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching payment info: ${message}`);
      throw new BadRequestException('Failed to fetch payment information');
    }
  }
}
