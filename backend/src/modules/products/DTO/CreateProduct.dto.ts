import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductSizeDTO } from './CreateProductSize.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDTO {
  @ApiProperty({ example: 'Remera Edición Limitada' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Remera de algodón orgánico con diseño exclusivo' })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty({ example: 'fglkafdgb123dfsg864' })
  @IsString()
  category_Id: string;

  @ApiProperty({ type: [CreateProductSizeDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDTO)
  sizes: CreateProductSizeDTO[];

  @ApiProperty({ type: [String], description: 'Array of file IDs' })
  @IsArray()
  @IsUUID('all', { each: true })
  file_Ids: string[];
}

export class UpdateProductDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsUUID()
  category_Id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID()
  file_Ids: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDTO)
  sizes?: CreateProductSizeDTO[];
}
