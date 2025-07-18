import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({
    description: 'Title of the visit',
    example: 'Visita a la planta de la Mosca Soldado',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the visit',
    required: false,
    example: 'Explora los beneficios de la Mosca Soldado y sus instalaciones.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Maximum number of people per group on this visit',
    required: false,
    example: 20,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  people?: number;
}

export class UpdateVisitDto extends PartialType(CreateVisitDto) {}
