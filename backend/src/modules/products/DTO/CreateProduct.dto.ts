import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductSizeDTO } from './CreateProductSize.dto';
import { PartialType } from '@nestjs/swagger';

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  details: string;

  @IsNumber()
  category_Id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDTO)
  sizes: CreateProductSizeDTO[];
}

export class UpdateProductDTO extends PartialType(CreateProductDTO) {}
