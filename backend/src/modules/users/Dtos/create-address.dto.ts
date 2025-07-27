import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Length,
  Matches,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Calle 61 Nº 841, La Plata, Buenos Aires',
    description: 'Dirección del usuario',
  })
  @IsString({ message: 'La dirección debe ser un texto' })
  @Length(3, 120, {
    message: 'La dirección debe tener entre 3 y 120 caracteres',
  })
  @Matches(/^[\p{L}\p{N}\s.,'#-]+$/u, {
    message:
      "La dirección solo puede contener letras, números, espacios y . , ' # -",
  })
  street: string;

  @ApiProperty({
    example: -34.9205,
    description: 'Latitud de la dirección',
    required: false,
  })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    example: -57.9536,
    description: 'Longitud de la dirección',
    required: false,
  })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  longitude?: number;
}
