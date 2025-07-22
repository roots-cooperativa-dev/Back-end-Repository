import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
} from '../dto/create-payment.dto';

export interface MercadoPagoPaymentInfo {
  id: number | string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  payment_type_id: string;
  payment_method_id: string;
  date_approved: string;
  external_reference: string;
}

export interface WebhookNotificationDto {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface PaymentCompletedEvent {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  statusDetail: string;
  paymentTypeId: string;
  paymentMethodId: string;
  dateApproved: string;
}

export interface IPaymentService {
  createPreference(
    userId: string,
    dto: CreatePreferenceDto,
  ): Promise<PreferenceResponseDto>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatusDto>;
  handleWebhook(notification: WebhookNotificationDto): Promise<void>;
}
