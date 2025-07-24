import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export enum SizeEnum {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export class CreateProductSizeDTO {
  @ApiProperty({ example: 'uuid-optional-id', required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: SizeEnum })
  @IsEnum(SizeEnum)
  size: SizeEnum;

  @ApiProperty({ example: 5500 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @IsPositive()
  stock: number;
}
