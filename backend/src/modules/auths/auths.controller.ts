import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { AuthsService } from './auths.service';
import { CreateUserDto, LoginUserDto } from '../users/Dtos/CreateUserDto';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthsController {
  constructor(private readonly authService: AuthsService) {}

  @Post('signin')
  @ApiBody({
    description: 'User credentials for sign in',
    type: LoginUserDto,
  })
  async signin(@Body() credentials: LoginUserDto) {
    return await this.authService.signin(
      credentials.email,
      credentials.password,
    );
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async signup(@Body() newUser: CreateUserDto) {
    return await this.authService.signup(newUser);
  }

  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  googleAuthRedirect(@Req() req: Request) {
    return req.user;
  }
}
