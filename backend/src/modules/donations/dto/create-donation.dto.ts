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
    description: 'ID del pago en MercadoPago',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[0-9]+$/, { message: 'pagoId debe contener solo números' })
  pagoId: string;

  @ApiProperty({
    enum: PaymentStatus,
    description: 'Estado del pago',
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    enum: PaymentStatusDetail,
    description: 'Detalle del estado del pago',
  })
  @IsEnum(PaymentStatusDetail)
  statusDetail: PaymentStatusDetail;

  @ApiProperty({
    description: 'Monto de la donación',
    example: 1000,
    minimum: 0.01,
    maximum: 1000000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0.01' })
  @Max(1000000, { message: 'El monto no puede exceder 1,000,000' })
  amount: number;

  @ApiProperty({
    description: 'ID de la moneda',
    example: 'ARS',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3, { message: 'currencyId debe tener exactamente 3 caracteres' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'currencyId debe ser un código ISO válido (ej: ARS, USD)',
  })
  currencyId: string;

  @ApiProperty({
    required: false,
    description: 'Tipo de pago (credit_card, debit_card, etc.)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  paymentTypeId?: string;

  @ApiProperty({
    required: false,
    description: 'Método de pago específico',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  paymentMethodId?: string;

  @ApiProperty({
    required: false,
    type: String,
    format: 'date-time',
    description: 'Fecha de aprobación del pago',
  })
  @IsOptional()
  @IsDateString()
  dateApproved?: Date;
}
