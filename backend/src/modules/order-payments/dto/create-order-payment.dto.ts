import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePreferenceDto } from 'src/modules/payments/dto/create-payment.dto';

export class CreateCartPreferenceDto extends CreatePreferenceDto {
  @ApiProperty({
    description: 'Cart ID to process payment for',
    example: 'b7e7db43-e1a0-493a-bbc3-ba8b6da08ec6',
  })
  @IsNotEmpty()
  @IsString()
  cartId: string;
}
