import {
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderProductDTO {
  @IsUUID()
  product_id: string;

  @IsUUID()
  size_id: string;
}

export class CreateOrderDTO {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDTO)
  products: OrderProductDTO[];
}
