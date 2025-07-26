import { IsString, Length, Matches } from 'class-validator';

export class CreateAddressDto {
  @IsString({ message: 'La dirección debe ser un texto' })
  @Length(3, 120, {
    message: 'La dirección debe tener entre 3 y 120 caracteres',
  })
  @Matches(/^[\p{L}\p{N}\s.,'#-]+$/u, {
    message:
      "La dirección solo puede contener letras, números, espacios y . , ' # -",
  })
  street: string;
}
