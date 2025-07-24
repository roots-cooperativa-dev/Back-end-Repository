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
    description:
      'Unique ID of the visit slot for which you wish to schedule the appointment.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  visitSlotId: string;

  @ApiProperty({
    description: 'Number of people for whom this appointment is scheduled.',
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
    description: 'Optional description of the reason for the visit.',
    example: 'I want to learn more about the donation program.',
    required: true,
  })
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Unique ID of the user scheduling the appointment. (Automatically obtained from the JWT token and optional in the request body.)',
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
