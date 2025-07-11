import {
  PickType,
  ApiProperty,
  ApiHideProperty,
  PartialType,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'This field must contain the users name',
    example: 'Carli',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 80)
  name: string;

  @ApiProperty({
    description: 'This field must contain the users email address',
    example: 'carli@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'This field must contain the birthdate',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString()
  birthdate: string;

  @ApiProperty({
    description: 'This field must contain the username',
    example: 'Carli87',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 80)
  username: string;

  @ApiHideProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/,
    {
      message:
        'The password must have at least one uppercase letter, one lowercase letter, one number, and one special character. (!@#$%^&*)',
    },
  )
  password: string;
}

export class LoginUserDto extends PickType(CreateUserDto, [
  'email',
  'password',
]) {}
export class UpdateUserDto extends PartialType(CreateUserDto) {}
