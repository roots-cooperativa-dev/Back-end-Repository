import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { UsersModule } from '../users/users.module';
import { NewsletterController } from './newsletter.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [UsersModule, ConfigModule],
  providers: [NewsletterService],
  controllers: [NewsletterController],
})
export class NewsletterModule {}
