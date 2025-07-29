import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/pagination/paginated-response.dto';
import { IDonateResponseDto } from '../interface/IDonateResponse';

export class ResponseDonateDtoSwagger implements IDonateResponseDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'pago-456' })
  pagoId: string;

  @ApiProperty({ example: 'approved' })
  status: string;

  @ApiProperty({ example: 'accredited' })
  statusDetail: string;

  @ApiProperty({ example: 100.5 })
  amount: number;

  @ApiProperty({ example: 'ARS' })
  currencyId: string;

  @ApiProperty({ example: 'credit_card' })
  paymentTypeId: string;

  @ApiProperty({ example: 'visa' })
  paymentMethodId: string;

  @ApiProperty({ example: '2025-07-29T10:00:00Z' })
  dateApproved: Date;

  @ApiProperty({ example: '2025-07-29T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: 'user-uuid-789' })
  userId: string;
}

@ApiExtraModels(ResponseDonateDtoSwagger)
export class PaginatedDonateDto extends PaginatedResponseDto<ResponseDonateDtoSwagger> {
  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(ResponseDonateDtoSwagger) },
  })
  items: ResponseDonateDtoSwagger[];
}

export class PaginationQueryDonationDto {
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  @Max(100)
  @ApiProperty({ example: 10, required: false, maximum: 100 })
  limit = 10;

  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ example: 1, required: false })
  page = 1;
}
