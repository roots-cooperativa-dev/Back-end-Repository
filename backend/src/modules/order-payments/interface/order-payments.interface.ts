export interface PaymentCompletedEvent {
  paymentId: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  statusDetail: string;
  paymentTypeId: string;
  paymentMethodId: string;
  dateApproved: string;
}
