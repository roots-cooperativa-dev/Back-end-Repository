import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import juice = require('juice');

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private async getStripoTemplateHtml(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const templatePath = path.resolve(
      process.cwd(),
      'dist',
      'modules',
      'mail',
      'templates',
      templateName,
    );

    let templateSource: string;
    try {
      templateSource = await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      console.error(`Error reading template file ${templatePath}:`, error);
      throw new InternalServerErrorException(
        `Failed to load email template: ${templateName}`,
      );
    }

    const template = Handlebars.compile(templateSource);
    const renderedHtml = template(context);
    return renderedHtml;
  }

  async sendMail(
    to: string,
    subject: string,
    textAlt: string,
    templateFileName: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      const emailFrom = `"ROOTS COOPERATIVA" <${this.configService.get<string>('EMAIL_FROM')}>`;
      const rawHtml = await this.getStripoTemplateHtml(
        templateFileName,
        context,
      );
      const inlinedHtml = juice(rawHtml);
      console.log(inlinedHtml);
      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html: inlinedHtml,
        text: textAlt,
      });

      console.log(
        `Correo enviado a ${to}: "${subject}" usando plantilla "${templateFileName}"`,
      );
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw new InternalServerErrorException(
        'Error al enviar el correo electrónico.',
      );
    }
  }

  async sendAppointmentPendingNotification(
    userEmail: string,
    userName: string,
    appointmentId: string,
    visitTitle: string,
    slotDate: string,
    slotTime: string,
  ): Promise<void> {
    const subject = 'Tu Cita está Pendiente de Aprobación';
    const textAlt = `Hola ${userName},\n\nTu cita para "${visitTitle}" el ${slotDate} a las ${slotTime} (ID: ${appointmentId}) está pendiente de aprobación.\n\nSaludos,\nROOTS COOPERATIVA.`;

    const context = {
      userName,
      visitTitle,
      slotDate,
      slotTime,
      appointmentId,
      appName: 'ROOTS COOPERATIVA',
    };

    await this.sendMail(
      userEmail,
      subject,
      textAlt,
      'appointment-pending.html',
      context,
    );
  }

  async sendAppointmentCancelledNotification(
    userEmail: string,
    userName: string,
    appointmentId: string,
    visitTitle: string,
    slotDate: string,
    slotTime: string,
    reason?: string,
  ): Promise<void> {
    const subject = 'Tu Cita ha Sido Cancelada';
    const baseText = `Hola ${userName},\n\nTu cita para "${visitTitle}" el ${slotDate} a las ${slotTime} (ID: ${appointmentId}) ha sido cancelada.`;
    const reasonText = reason ? `\nRazón: ${reason}` : '';
    const finalTextAlt = `${baseText}${reasonText}\n\nSaludos,\nROOTS COOPERATIVA.`;

    const context = {
      userName,
      visitTitle,
      slotDate,
      slotTime,
      appointmentId,
      reason: reason || '',
      appName: 'ROOTS COOPERATIVA',
    };

    await this.sendMail(
      userEmail,
      subject,
      finalTextAlt,
      'appointment-cancelled.html',
      context,
    );
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const subject = '¡Bienvenido a ROOTS COOPERATIVA!';
    const textAlt = `Hola ${userName},\n\nGracias por registrarte. ¡Esperamos que disfrutes!\n\nROOTS COOPERATIVA.`;

    const context = {
      userName,
      appName: 'ROOTS COOPERATIVA',
      appLink: 'https://frontend-rootscoop.vercel.app',
    };

    await this.sendMail(
      userEmail,
      subject,
      textAlt,
      'welcome-email.html',
      context,
    );
  }

  async sendLoginNotification(
    userEmail: string,
    userName: string,
  ): Promise<void> {
    const subject = 'Inicio de Sesión en tu Cuenta';
    const textAlt = `Hola ${userName},\n\nSe ha iniciado sesión en tu cuenta.\n\nSi no fuiste tú, contactá a soporte.\n\nROOTS COOPERATIVA.`;

    const context = {
      userName,
      appName: 'ROOTS COOPERATIVA',
      supportLink: 'https://frontend-rootscoop.vercel.app/contact',
    };

    await this.sendMail(
      userEmail,
      subject,
      textAlt,
      'login-notification.html',
      context,
    );
  }
  async sendOrderProcessingNotification(
    userEmail: string,
    userName: string,
    orderId: string,
  ): Promise<void> {
    const subject = 'Tu Orden Está en Proceso';
    const textAlt = `Hola ${userName},\n\nTu orden #${orderId} está siendo procesada. Te avisaremos cuando esté lista para retiro o envío.\n\nSaludos,\nROOTS COOPERATIVA.`;

    const context = {
      userName,
      orderId,
      appName: 'ROOTS COOPERATIVA',
    };

    await this.sendMail(
      userEmail,
      subject,
      textAlt,
      'order-processing.html',
      context,
    );
  }
  async sendUserDataChangedNotification(
    userEmail: string,
    userName: string,
  ): Promise<void> {
    const subject = 'Tus Datos Personales Han Sido Modificados';
    const textAlt = `Hola ${userName},\n\nSe han modificado los datos de tu cuenta.\n\nSi no fuiste vos, contactá al equipo de soporte inmediatamente.\n\nROOTS COOPERATIVA.`;

    const context = {
      userName,
      appName: 'ROOTS COOPERATIVA',
      supportLink: 'https://frontend-rootscoop.vercel.app/contact',
    };

    await this.sendMail(
      userEmail,
      subject,
      textAlt,
      'data-changed.html',
      context,
    );
  }
}
