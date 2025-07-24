import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  Matches,
  Min,
  Max,
} from 'class-validator';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

export enum PaymentStatusDetail {
  ACCREDITED = 'accredited',

  PENDING_CONTINGENCY = 'pending_contingency',
  PENDING_REVIEW_MANUAL = 'pending_review_manual',
  PENDING_WAITING_PAYMENT = 'pending_waiting_payment',
  PENDING_WAITING_TRANSFER = 'pending_waiting_transfer',

  CC_REJECTED_CALL_FOR_AUTHORIZE = 'cc_rejected_call_for_authorize',
  CC_REJECTED_CARD_DISABLED = 'cc_rejected_card_disabled',
  CC_REJECTED_INSUFFICIENT_AMOUNT = 'cc_rejected_insufficient_amount',
  CC_REJECTED_MAX_ATTEMPTS = 'cc_rejected_max_attempts',
  CC_REJECTED_OTHER_REASON = 'cc_rejected_other_reason',

  REJECTED_BY_REGULATIONS = 'rejected_by_regulations',
  REJECTED_HIGH_RISK = 'rejected_high_risk',
  REJECTED_BY_BANK = 'rejected_by_bank',
}

export class CreateDonateDto {
  @ApiProperty({
    description: 'Payment ID in MercadoPago',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[0-9]+$/, { message: 'paymentId must contain only numbers' })
  pagoId: string;

  @ApiProperty({
    enum: PaymentStatus,
    description: 'payment state',
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    enum: PaymentStatusDetail,
    description: 'payment detail state',
  })
  @IsEnum(PaymentStatusDetail)
  statusDetail: PaymentStatusDetail;

  @ApiProperty({
    description: 'donation amount',
    example: 1000,
    minimum: 0.01,
    maximum: 1000000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'The amount must be greater than 0.01' })
  @Max(1000000, { message: 'The amount cannot exceed 1,000,000' })
  amount: number;

  @ApiProperty({
    description: 'Currency ID',
    example: 'ARS',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3, { message: 'currencyId must be exactly 3 characters long' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'currencyId must be a valid ISO code (e.g. ARS, USD)',
  })
  currencyId: string;

  @ApiProperty({
    required: false,
    description: 'Payment type (credit_card, debit_card, etc.)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  paymentTypeId?: string;

  @ApiProperty({
    required: false,
    description: 'Specific payment method',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  paymentMethodId?: string;

  @ApiProperty({
    required: false,
    type: String,
    format: 'date-time',
    description: 'Payment approval date',
  })
  @IsOptional()
  @IsDateString()
  dateApproved?: Date;
}
