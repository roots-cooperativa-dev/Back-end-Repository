import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({
    description: 'Título de la visita',
    example: 'Visita a la planta de la Mosca Soldado',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descripción detallada de la visita',
    required: false,
    example: 'Explora los beneficios de la Mosca Soldado y sus instalaciones.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Número máximo de personas por grupo en esta visita',
    required: false,
    example: 20,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  people?: number;
}
