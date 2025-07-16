import {
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderProductDTO {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  @IsUUID()
  product_id: string;

  @ApiProperty({ example: '1f2e3d4c-5b6a-7e89-0123-45678abcdef1' })
  @IsUUID()
  size_id: string;
}

export class CreateOrderDTO {
  @ApiProperty({ example: 'f4e6b720-12ef-4b9e-9f31-86de0cbf9cf7' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ type: [OrderProductDTO] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDTO)
  products: OrderProductDTO[];
}
