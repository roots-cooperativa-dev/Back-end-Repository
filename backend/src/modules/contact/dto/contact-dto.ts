import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del contacto',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Email del contacto',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+541112345678',
    description: 'Teléfono de contacto',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'Consulta sobre servicios',
    description: 'Motivo de contacto',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
