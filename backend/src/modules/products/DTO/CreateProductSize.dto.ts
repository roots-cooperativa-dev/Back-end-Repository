import { IsEnum, IsNumber, IsPositive } from 'class-validator';

export enum SizeEnum {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export class CreateProductSizeDTO {
  @IsEnum(SizeEnum)
  size: SizeEnum;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  stock: number;
}
