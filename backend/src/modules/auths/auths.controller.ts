import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthsService } from './auths.service';
import { CreateUserDto, LoginUserDto } from '../users/Dtos/CreateUserDto';

@ApiTags('Auth')
@Controller('auth')
export class AuthsController {
  constructor(private readonly authService: AuthsService) {}

  @ApiOperation({ summary: 'Sign in user' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'User signed in successfully, returns access token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @Post('signin')
  async signin(@Body() credentials: LoginUserDto) {
    return await this.authService.signin(
      credentials.email,
      credentials.password,
    );
  }

  @ApiOperation({ summary: 'Sign up new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user data or email already exists',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @Post('signup')
  async signup(@Body() newUser: CreateUserDto) {
    return await this.authService.signup(newUser);
  }

  @ApiOperation({ summary: 'Initiate Google OAuth authentication' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  @UseGuards(PassportAuthGuard('google'))
  @Get('google')
  async googleAuth() {}

  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiResponse({
    status: 200,
    description:
      'Google authentication successful, returns user data and token',
  })
  @ApiResponse({
    status: 401,
    description: 'Google authentication failed',
  })
  @UseGuards(PassportAuthGuard('google'))
  @Get('google/callback')
  async googleAuthRedirect(@Req() req: Request) {
    const googleUser = req.user as {
      id: string;
      name: string;
      email: string;
      accessToken: string;
    };

    return await this.authService.googleLogin(googleUser);
  }
}
