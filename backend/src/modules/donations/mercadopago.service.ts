import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../users/Entyties/users.entity';
import { DonationsService } from './donations.service';
import { CreatePreferenceDto } from './dto/create-preference.dto.ts';

export interface MercadoPagoPaymentInfo {
  id: number | string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  payment_type_id: string;
  payment_method_id: string;
  date_approved: string;
  external_reference: string; // userId
}

export interface CreateDonationFromPaymentDto {
  pagoId: string;
  status: string;
  statusDetail: string;
  transactionAmount: number;
  currencyId: string;
  paymentTypeId: string;
  paymentMethodId: string;
  dateApproved: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly mp: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly donationsService: DonationsService,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {
    // this.mp = MercadoPagoService; // TS-friendly alias
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    // this.mp.configure({
    //   access_token: this.configService.get<string>('MP_ACCESS_TOKEN') ?? '',
    // });
  }

  async createPreference(userId: string, dto: CreatePreferenceDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException(`User with ID ${userId} not found`);
      }

      const preference = {
        items: [
          {
            title: 'Donation to ROOTS',
            description: dto.message || 'Voluntary donation',
            unit_price: Number(dto.amount),
            quantity: 1,
            currency_id: dto.currency || 'ARS',
          },
        ],
        back_urls: {
          success: `${this.configService.get<string>('FRONTEND_URL')}/donation/success`,
          failure: `${this.configService.get<string>('FRONTEND_URL')}/donation/failure`,
          pending: `${this.configService.get<string>('FRONTEND_URL')}/donation/pending`,
        },
        auto_return: 'approved',
        notification_url: `${this.configService.get<string>('BACKEND_URL')}/donations/webhook`,
        external_reference: userId,
        payment_methods: {
          excluded_payment_types: [{ id: 'atm' }],
          installments: 12,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const response = await this.mp.preferences.create(preference);

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Payment preference created: ${response.body.id} for user: ${userId}`,
      );

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        preferenceId: response.body.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        initPoint: response.body.init_point,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        sandboxInitPoint: response.body.sandbox_init_point,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error creating preference: ${err.message}`);
      throw new BadRequestException('Failed to create payment preference');
    }
  }

  async handleWebhook(notification: unknown) {
    try {
      this.logger.log(`Webhook received: ${JSON.stringify(notification)}`);

      const notif = notification as {
        type: string;
        data: { id: string };
      };

      if (notif.type === 'payment') {
        const paymentId = notif.data.id;
        const paymentInfo = await this.getPaymentInfo(paymentId);

        if (paymentInfo.status === 'approved') {
          await this.createDonationFromPayment(paymentInfo);
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error processing webhook: ${err.message}`);
      throw err;
    }
  }

  private async getPaymentInfo(
    paymentId: string,
  ): Promise<MercadoPagoPaymentInfo> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const payment = await this.mp.payment.findById(paymentId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return payment.body as MercadoPagoPaymentInfo;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error fetching payment info: ${err.message}`);
      throw new BadRequestException('Failed to fetch payment information');
    }
  }

  async getPaymentStatus(paymentId: string) {
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
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error getting payment status: ${err.message}`);
      throw err;
    }
  }

  private async createDonationFromPayment(paymentInfo: MercadoPagoPaymentInfo) {
    try {
      const userId = paymentInfo.external_reference;

      if (!userId) {
        this.logger.error('No user ID found in payment external_reference');
        return;
      }

      const createDonationDto: CreateDonationFromPaymentDto = {
        pagoId: paymentInfo.id.toString(),
        status: paymentInfo.status,
        statusDetail: paymentInfo.status_detail,
        transactionAmount: paymentInfo.transaction_amount,
        currencyId: paymentInfo.currency_id,
        paymentTypeId: paymentInfo.payment_type_id,
        paymentMethodId: paymentInfo.payment_method_id,
        dateApproved: paymentInfo.date_approved,
      };

      const donation = await this.donationsService.create(
        userId,
        createDonationDto,
      );

      return donation;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error creating donation from payment: ${err.message}`);
      throw err;
    }
  }
}
