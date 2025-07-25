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
import { File } from 'src/modules/file-upload/entity/file-upload.entity';

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

  @ApiProperty({
    example: '3496gi237082hd09dhfos02r',
    description: 'Array of file IDs',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  file_Ids: string[];
}

export class UpdateProductDTO {
  @ApiProperty({ example: 'Remera Edición Limitada' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Remera de algodón orgánico con diseño exclusivo' })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({ example: 'fglkafdgb123dfsg864' })
  @IsOptional()
  @IsUUID()
  category_Id?: string;

  @ApiProperty({
    example: '3496gi237082hd09dhfos02r',
    description: 'Array of file IDs',
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  file_Ids?: File[];

  @ApiProperty({ type: [CreateProductSizeDTO] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDTO)
  sizes?: CreateProductSizeDTO[];
}
