import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDTO {
  @ApiProperty({ example: 'Indumentaria' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateCategoryDTO extends PartialType(CreateCategoryDTO) {}
