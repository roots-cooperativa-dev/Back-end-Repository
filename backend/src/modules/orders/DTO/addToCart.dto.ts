import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class AddToCartDTO {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    description: 'ID del producto a agregar',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: '1f2e3d4c-5b6a-7e89-0123-45678abcdef1',
    description: 'ID de la talla específica del producto',
  })
  @IsUUID()
  productSizeId: string;

  @ApiProperty({ example: 1, description: 'Cantidad del producto a agregar' })
  @IsInt()
  @Min(1)
  quantity: number;
}
