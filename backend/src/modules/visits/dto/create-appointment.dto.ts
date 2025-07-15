import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID único del slot de visita al que se desea agendar la cita.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  visitSlotId: string;

  @ApiProperty({
    description: 'Número de personas para las que se agenda esta cita.',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfPeople?: number;

  @ApiProperty({
    description:
      'ID único del usuario que agenda la cita. (Se obtiene automáticamente del token JWT y es opcional en el body de la solicitud)',
    example: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    format: 'uuid',
    required: false,
    readOnly: true,
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string;
}
