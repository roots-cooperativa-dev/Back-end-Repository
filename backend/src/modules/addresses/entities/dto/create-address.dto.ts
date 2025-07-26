import { IsString, Length, Matches } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @Length(3, 120)
  @Matches(/^[\p{L}\p{N}\s.,'#-]+$/u, {
    message:
      "La dirección solo puede contener letras, números, espacios y . , ' # -",
  })
  street: string;
}
