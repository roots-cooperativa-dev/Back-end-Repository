import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum OrderStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PROCESSED = 'processed',
  FINALIZED = 'finalized',
}

export class UpdateOrderStatusDTO {
  @ApiProperty({
    example: 'finalized',
    enum: ['active', 'cancelled', 'processed', 'finalized'],
  })
  @IsEnum(OrderStatus, {
    message: 'Status must be one of: active, cancelled, processed, finalized',
  })
  status: OrderStatus;
}
