import { Donate } from '../entities/donation.entity';

export interface IDonateResponseDto {
  id: string;
  pagoId: string;
  status: string;
  statusDetail: string;
  transactionAmount: number;
  currencyId: string;
  paymentTypeId: string;
  paymentMethodId: string;
  dateApproved: Date;
  createdAt: Date;
  userId: string;
}

export class ResponseDonateDto {
  static toDTO(donate: Donate): IDonateResponseDto {
    return {
      id: donate.id,
      pagoId: donate.pagoId,
      status: donate.status,
      statusDetail: donate.statusDetail,
      transactionAmount: donate.transactionAmount,
      currencyId: donate.currencyId,
      paymentTypeId: donate.paymentTypeId,
      paymentMethodId: donate.paymentMethodId,
      dateApproved: donate.dateApproved,
      createdAt: donate.createdAt,
      userId: donate.user.id,
    };
  }
}
