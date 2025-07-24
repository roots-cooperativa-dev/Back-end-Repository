import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/pagination/paginated-response.dto';
import { ResponseUserWithAdminDto } from '../interface/IUserResponseDto';

@ApiExtraModels(ResponseUserWithAdminDto)
export class PaginatedUsersDto extends PaginatedResponseDto<ResponseUserWithAdminDto> {
  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(ResponseUserWithAdminDto) },
  })
  items: ResponseUserWithAdminDto[];
}
