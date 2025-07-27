import { IsEmail, IsString } from 'class-validator';

export class SendWelcomeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
