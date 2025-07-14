import {
  Controller,
  Get,
  Put,
  Delete,
  UseGuards,
  UsePipes,
  Query,
  Param,
  Body,
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
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
import { UpdateUserDto } from './Dtos/CreateUserDto';
import {
  IUserResponseDto,
  ResponseUserDto,
  ResponseUserWithAdminDto,
} from './interface/IUserResponseDto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Retrieve all users with pagination' })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated list of users',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ResponseUserWithAdminDto[]> {
    const pageNumber = page ? Number(page) : undefined;
    const limitNumber = limit ? Number(limit) : undefined;
    const users = await this.usersService.getUsers(pageNumber, limitNumber);
    return ResponseUserWithAdminDto.toDTOList(users);
  }

  @ApiOperation({ summary: 'Retrieve user by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseUserDto> {
    return ResponseUserDto.toDTO(await this.usersService.getUserById(id));
  }

  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<UpdateUserDto>,
  ): Promise<IUserResponseDto> {
    return ResponseUserDto.toDTO(
      await this.usersService.updateUserService(id, updateData),
    );
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.deleteUserService(id);
    return {
      message: `User with id ${id} deleted successfully`,
    };
  }
}
