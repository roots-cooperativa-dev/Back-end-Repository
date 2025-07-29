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
  Delete,
  Patch,
  Post,
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
  AuthenticatedRequest,
} from './interface/IUserResponseDto';
import { UpdateUserDbDto } from './Dtos/CreateUserDto';
import { PaginationQueryDto } from './Dtos/PaginationQueryDto';
import { PaginatedUsersDto } from './Dtos/paginated-users.dto';
import { UpdatePasswordDto } from './Dtos/UpdatePasswordDto';
import { UpdateRoleDto } from './Dtos/UpdateRoleDto';
import { Users } from './Entyties/users.entity';
import { ForgotPasswordDto } from './Dtos/forgot-password.dto';
import { ResetPasswordDto } from './Dtos/reset-password.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users for newsletter' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Find all users to send newsletter',
    type: [Users],
  })
  @Get('all/newsletter')
  async findAll(): Promise<Users[]> {
    return this.usersService.findAll();
  }

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

  @Patch('password')
  @UseGuards(AuthGuard)
  async changeOwnPassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.sub, dto);
    return { message: 'Contraseña actualizada correctamente' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'OK', type: ResponseUserDto })
  @UseGuards(AuthGuard)
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseUserDto> {
    return ResponseUserDto.toDTO(await this.usersService.getUserById(id));
  }

  @Patch('Roles/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.SUPERADMIN)
  async rollChange(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const userRole = await this.usersService.rollChange(userId, dto);
    return { message: 'Los roles se actualizaron correctamente', userRole };
  }

  @Put('update/user')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDbDto })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateUserDbDto,
  ): Promise<IUserResponseDto> {
    const user = await this.usersService.updateUserService(
      req.user.sub,
      updateData,
    );
    return ResponseUserDto.toDTO(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID (soft delete)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.deleteUser(id);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Si el email existe, se envía link de reseteo',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.usersService.sendResetPasswordEmail(dto.email);
    return {
      message:
        'Si el email existe, se envió el link para reestablecer contraseña',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Resetear contraseña usando token de email' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña reseteada correctamente',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.usersService.resetPassword(dto);
    return { message: 'Contraseña restablecida correctamente' };
  }
}
