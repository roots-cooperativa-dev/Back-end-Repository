import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDTO {
  @ApiProperty({
    example: 2,
    description: 'Nueva cantidad para el ítem del carrito',
  })
  @IsInt()
  @Min(0, { message: 'Quantity must be at least 0. Use 0 to remove item.' })
  quantity: number;
}
