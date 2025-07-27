import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import {
  buildMonthlyNewsletterHtml,
  buildWelcomeNewsletterHtml,
} from './templates/newsletter-templates';

interface User {
  name: string;
  email: string;
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  @Cron('0 9 1 * *', { timeZone: 'America/Argentina/Buenos_Aires' })
  async sendMonthlyNewsletter() {
    this.logger.log('📨 Sending monthly newsletter...');
    const users: User[] = await this.usersService.findAll();

    for (const user of users) {
      const html = buildMonthlyNewsletterHtml(user.name);

      try {
        await this.transporter.sendMail({
          to: user.email,
          from: `"ROOTS Cooperativa" <${this.configService.get('EMAIL_USER')}>`,
          subject: '🌱 Tu newsletter mensual - ROOTS',
          html,
        });
        this.logger.log(`✅ Sent to: ${user.email}`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error(`Error send to ${user.email}: ${error.message}`);
        } else {
          this.logger.error(`Unknown error sending to ${user.email}`);
        }
      }
    }
  }

  async sendWelcomeNewsletter(user: User) {
    const html = buildWelcomeNewsletterHtml(user.name);

    try {
      await this.transporter.sendMail({
        to: user.email,
        from: `"ROOTS Cooperativa" <${this.configService.get('EMAIL_USER')}>`,
        subject: '🌿 ¡Bienvenidx a ROOTS COOPERATIVA!',
        html,
      });
      this.logger.log(`👋 Newsletter welcome sent to ${user.email}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error sending welcome to ${user.email}: ${error.message}`,
        );
      } else {
        this.logger.error(`Error unknown sending welcome to ${user.email}`);
      }
    }
  }
}
