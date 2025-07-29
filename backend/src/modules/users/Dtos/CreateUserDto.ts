import {
  PickType,
  ApiProperty,
  ApiHideProperty,
  PartialType,
  OmitType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/users/Dtos/create-address.dto';

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
    description: 'This field must contain the phone number',
    example: 1234567890,
  })
  @IsOptional()
  @IsNumber()
  phone: number;

  @ApiProperty({
    description:
      'Dirección completa, puede incluir latitud y longitud si el frontend lo provee',
    example: {
      street: 'Calle 61 Nº 841, La Plata, Buenos Aires',
      latitude: -34.9205,
      longitude: -57.9536,
    },
    type: CreateAddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @ApiProperty({
    description: 'This field must contain the username',
    example: 'Carli87',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 80)
  username: string;

  @ApiProperty({
    description: 'This field must contain the password',
    example: 'Carli87@',
  })
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

  @ApiProperty({
    description: 'This field must contain the confirm password',
    example: 'Carli87@',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/,
    {
      message:
        'The confirmPassword must have at least one uppercase letter, one lowercase letter, one number, and one special character. (!@#$%^&*)',
    },
  )
  confirmPassword: string;

  @ApiHideProperty()
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiHideProperty()
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @ApiHideProperty()
  @IsOptional()
  @IsBoolean()
  isDonator?: boolean;
}

export class LoginUserDto extends PickType(CreateUserDto, [
  'email',
  'password',
]) {}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class CreateUserDbDto extends OmitType(CreateUserDto, [
  'confirmPassword',
] as const) {}

export class UpdateUserDbDto extends OmitType(UpdateUserDto, [
  'confirmPassword',
  'email',
] as const) {}
