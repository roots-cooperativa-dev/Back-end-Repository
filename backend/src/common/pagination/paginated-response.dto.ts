import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  pages: number;

  items: T[];
}
