import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class AddToCartDTO {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    description: 'Product ID to add',
  })
  @IsUUID()
  producttId: string;

  @ApiProperty({
    example: '1f2e3d4c-5b6a-7e89-0123-45678abcdef1',
    description: 'Product-specific size ID',
  })
  @IsUUID()
  productSizeId: string;

  @ApiProperty({ example: 1, description: 'Quantity of product to add' })
  @IsInt()
  @Min(1)
  quantity: number;
}
