import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
  UsePipes,
  ParseUUIDPipe,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { AuthGuard } from 'src/guards/auth.guards';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import {
  ResponseUserDto,
  ResponseUserWithAdminDto,
  IUserResponseDto,
} from './interface/IUserResponseDto';
import { UpdateUserDbDto } from './Dtos/CreateUserDto';
import { PaginationQueryDto } from './Dtos/PaginationQueryDto';
import { PaginatedUsersDto } from './Dtos/paginated-users.dto';
import { UpdatePasswordDto } from './Dtos/UpdatePasswordDto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Retrieve all users (paginated)' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'OK', type: PaginatedUsersDto })
  @Get()
  async getUsers(
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedUsersDto> {
    const { items, ...meta } = await this.usersService.getUsers(pagination);
    return { ...meta, items: ResponseUserWithAdminDto.toDTOList(items) };
  }

  @ApiOperation({ summary: 'Retrieve user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'OK', type: ResponseUserDto })
  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseUserDto> {
    return ResponseUserDto.toDTO(await this.usersService.getUserById(id));
  }

  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDbDto })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<UpdateUserDbDto>,
  ): Promise<IUserResponseDto> {
    const user = await this.usersService.updateUserService(id, updateData);
    return ResponseUserDto.toDTO(user);
  }
  @Put('password')
  @UseGuards(AuthGuard)
  async changeOwnPassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.sub, dto);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
