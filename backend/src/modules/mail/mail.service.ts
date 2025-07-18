import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

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

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"ROOTS COOPERATIVA" <${this.configService.get<string>('EMAIL_FROM')}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`Correo enviado a ${to}: ${subject}`);
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
    const text = `Hola ${userName},\n\nTu cita para "${visitTitle}" en la fecha ${slotDate} a las ${slotTime} (ID: ${appointmentId}) está pendiente de aprobación.\n\nTe notificaremos tan pronto como sea aprobada o cancelada.\n\nSaludos,\nEl equipo de Tu Aplicación.`;
    const html = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu cita para <strong>"${visitTitle}"</strong> programada para el <strong>${slotDate}</strong> a las <strong>${slotTime}</strong> (ID: ${appointmentId}) está actualmente <strong>pendiente de aprobación</strong>.</p>
      <p>Te enviaremos otra notificación tan pronto como sea aprobada o cancelada por la administración.</p>
      <p>Gracias por tu paciencia.</p>
      <p>Saludos,</p>
      <p>El equipo de Tu Aplicación.</p>
    `;
    await this.sendMail(userEmail, subject, text, html);
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
    const baseText = `Hola ${userName},\n\nTu cita para "${visitTitle}" en la fecha ${slotDate} a las ${slotTime} (ID: ${appointmentId}) ha sido cancelada.`;
    const baseHtml = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Lamentamos informarte que tu cita para <strong>"${visitTitle}"</strong> programada para el <strong>${slotDate}</strong> a las <strong>${slotTime}</strong> (ID: ${appointmentId}) ha sido <strong>cancelada</strong>.</p>
    `;

    const reasonText = reason ? `\nRazón: ${reason}` : '';
    const reasonHtml = reason
      ? `<p><strong>Razón de la cancelación:</strong> ${reason}</p>`
      : '';

    const text = `${baseText}${reasonText}\n\nPor favor, contacta con nosotros para más información o para reprogramar.\n\nSaludos,\nEl equipo de Tu Aplicación.`;
    const html = `${baseHtml}${reasonHtml}<p>Por favor, contacta con nosotros para más información o para reprogramar.</p><p>Saludos,</p><p>El equipo de Tu Aplicación.</p>`;

    await this.sendMail(userEmail, subject, text, html);
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const subject = '¡Bienvenido a Tu Aplicación!';
    const text = `Hola ${userName},\n\nGracias por registrarte en nuestra aplicación. ¡Esperamos que disfrutes de tu experiencia!\n\nSaludos,\nEl equipo de Tu Aplicación.`;
    const html = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>¡Bienvenido/a a Tu Aplicación! Estamos encantados de tenerte con nosotros.</p>
      <p>Esperamos que disfrutes de todas nuestras funcionalidades.</p>
      <p>Saludos cordiales,</p>
      <p>El equipo de Tu Aplicación.</p>
    `;
    await this.sendMail(userEmail, subject, text, html);
  }
  async sendLoginNotification(
    userEmail: string,
    userName: string,
  ): Promise<void> {
    const subject = 'Inicio de Sesión en tu Cuenta';
    const text = `Hola ${userName},\n\nSe ha iniciado sesión en tu cuenta de ROOTS COOPERATIVA.\n\nSi no fuiste tú, por favor, contacta a soporte inmediatamente.\n\nSaludos,\nEl equipo de ROOTS COOPERATIVA.`;
    const html = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Se ha iniciado sesión en tu cuenta de <strong>ROOTS COOPERATIVA</strong>.</p>
      <p>Si no fuiste tú, por favor, <a href="#">contacta a soporte inmediatamente</a>.</p>
      <p>Saludos cordiales,</p>
      <p>El equipo de ROOTS COOPERATIVA.</p>
    `;
    await this.sendMail(userEmail, subject, text, html);
  }
}
