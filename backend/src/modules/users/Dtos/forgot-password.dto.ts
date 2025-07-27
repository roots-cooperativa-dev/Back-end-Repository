import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'andresdelossantos99@gmail.com',
    description: 'Email del usuario que solicita el reseteo de contraseña',
  })
  @IsEmail()
  email: string;
}
