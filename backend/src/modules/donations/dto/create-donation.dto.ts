import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateDonateDto {
  @ApiProperty({ description: 'ID del pago en Mercado Pago' })
  @IsString()
  @IsNotEmpty()
  pagoId: string;

  @ApiProperty({ description: 'Estado del pago', example: 'approved' })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Detalle del estado del pago',
    example: 'accredited',
  })
  @IsString()
  statusDetail: string;

  @ApiProperty({ description: 'Monto total de la transacción', example: 100.0 })
  @IsNumber()
  transactionAmount: number;

  @ApiProperty({ description: 'Moneda de la transacción', example: 'ARS' })
  @IsString()
  currencyId: string;

  @ApiProperty({ description: 'Tipo de pago', example: 'credit_card' })
  @IsString()
  paymentTypeId: string;

  @ApiProperty({ description: 'Método de pago', example: 'visa' })
  @IsString()
  paymentMethodId: string;

  @ApiProperty({
    description: 'Fecha de aprobación del pago',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  dateApproved: string;
}
