import {
  Controller,
  Get,
  UseGuards,
  Query,
  Param,
  ParseUUIDPipe,
  Put,
  Body,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { AuthGuard } from 'src/guards/auth.guards';
import { UpdateUserDto } from './Dtos/CreateUserDto';
import { RoleGuard } from 'src/guards/auth.guards.admin';
import {
  IUserResponseDto,
  ResponseUserDto,
  ResponseUserWithAdminDto,
} from './interface/IUserResponseDto';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users list' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getUsers(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 5,
  ): Promise<ResponseUserWithAdminDto[]> {
    const users = await this.usersService.getUsers(page, limit);
    return ResponseUserWithAdminDto.toDTOList(users);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Users by id' })
  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseUserDto> {
    return ResponseUserDto.toDTO(await this.usersService.getUserById(id));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @UseGuards(AuthGuard)
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<UpdateUserDto>,
  ): Promise<IUserResponseDto> {
    return ResponseUserDto.toDTO(
      await this.usersService.updateUserService(id, updateData),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @Delete(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.deleteUserService(id);
    return {
      message: `Usuario con id ${id} eliminado correctamente`,
    };
  }
}
