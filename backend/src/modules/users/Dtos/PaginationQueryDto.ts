import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  page = 1;
}
