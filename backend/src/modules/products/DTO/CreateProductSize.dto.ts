import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';

export enum SizeEnum {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export class CreateProductSizeDTO {
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
