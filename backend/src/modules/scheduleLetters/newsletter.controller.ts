import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SendWelcomeDto } from './dto/send-welcome-dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles, UserRole } from 'src/decorator/role.decorator';
import { RoleGuard } from 'src/guards/auth.guards.admin';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post('send-welcome')
  @ApiOperation({ summary: 'Send welcome newsletter to a user' })
  async sendWelcome(@Body() user: SendWelcomeDto) {
    return this.newsletterService.sendWelcomeNewsletter(user);
  }
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post('send-monthly')
  @ApiOperation({
    summary: 'Send monthly newsletter to users',
  })
  async sendMonthly() {
    return this.newsletterService.sendMonthlyNewsletter();
  }
}
