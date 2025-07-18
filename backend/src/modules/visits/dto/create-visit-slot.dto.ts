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
    description: 'Slot date YYYY-MM-DD.',
    example: '2025-07-25',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Slot time format: HH:MM (24hs).',
    example: '10:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formar must be HH:MM',
  })
  startTime: string;

  @ApiProperty({
    description: 'Finally hour in format HH:MM (24 horas).',
    example: '11:30',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format must be HH:MM',
  })
  endTime: string;

  @ApiProperty({
    description: 'Maximum number of people who can book for this slot',
    example: 15,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAppointments?: number;
}
