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

  @Cron('0 9 1 * *', {
    name: 'monthly-newsletter',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleMonthlyNewsletter() {
    this.logger.log('🚀 Iniciando el envío de la newsletter mensual...');

    let users: User[] = [];
    try {
      users = await this.usersService.findAll();
      this.logger.log(
        `📧 Encontrados ${users.length} usuarios para el newsletter.`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error al obtener usuarios: ${error.message}`);
      } else {
        this.logger.error('Error desconocido al obtener usuarios.');
      }
      return;
    }

    if (users.length === 0) {
      this.logger.warn(
        'No hay usuarios registrados para enviar la newsletter.',
      );
      return;
    }

    for (const user of users) {
      const htmlContent = buildMonthlyNewsletterHtml(user.name);

      try {
        await this.transporter.sendMail({
          to: user.email,
          from: `"ROOTS Cooperativa" <${this.configService.get('EMAIL_USER')}>`,
          subject: '🌱 Tu newsletter mensual - ROOTS',
          html: htmlContent,
        });
        this.logger.log(`✅ Newsletter mensual enviada a: ${user.email}`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error(
            `❌ Error al enviar newsletter a ${user.email}: ${error.message}`,
          );
        } else {
          this.logger.error(
            `❌ Error desconocido al enviar newsletter a ${user.email}`,
          );
        }
      }
    }
    this.logger.log('🎉 Envío de newsletter mensual finalizado.');
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
      this.logger.log(`👋 Newsletter bienvenida enviada a ${user.email}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al enviar bienvenida a ${user.email}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Error desconocido al enviar bienvenida a ${user.email}`,
        );
      }
    }
  }
}
