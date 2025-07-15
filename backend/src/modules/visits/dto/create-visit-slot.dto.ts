import {
  IsString,
  IsNotEmpty,
  IsDateString,
  Matches,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitSlotDto {
  @ApiProperty({
    description: 'Fecha del slot de visita en formato YYYY-MM-DD.',
    example: '2025-07-25',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Hora de inicio del slot en formato HH:MM (24 horas).',
    example: '10:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato de hora debe ser HH:MM',
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin en formato HH:MM (24 horas).',
    example: '11:30',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato de hora debe ser HH:MM',
  })
  endTime: string;

  @ApiProperty({
    description: 'Número máximo de citas que se pueden agendar para este slot.',
    example: 5,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAppointments?: number;
}
