import Mailgun from 'mailgun.js';import * as formData from 'form-data';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export type generateMessageParams = {
  to: string;
  name: string;
  type: string;
  code?: string;
};

export type GeneratorEmailParticipant = {
  qrCode: string;
  qrCodeHtml: string;
  eventName: string;
  ticketName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  invictaClub: string;
  eventSlug: string;
  staffEmail: string;
  staffPassword: string;
  days?: string;
};

@Injectable()
export class EmailService {
  private API_KEY: string;
  private DOMAIN: string;
  private FROM: string;

  constructor(private configService: ConfigService) {
    this.API_KEY = this.configService.get<string>('app.mailGunApiKey');
    this.DOMAIN = this.configService.get<string>('app.mailGunDomain');
    this.FROM = this.configService.get<string>('app.mailGunFrom');
  }

  async sendEmail(
    data: generateMessageParams,
    generatorEmailParticipant?: GeneratorEmailParticipant,
  ): Promise<void> {
    const { to, name, type, code } = data;
    const from = this.FROM;
    let subject;
    let html;

    if (type == 'newUser') {
      html = await fs
        .readFileSync(
          'src/templates/emails/emailWelcome/beta-welcome.html',
          'utf-8',
        )
        .replace('[USERNAME]', name.split(' ')[0]);

      subject = 'Bem-vindo à plataforma Nex Event!';
    } else if (type == 'newGuest') {
      html = await fs
        .readFileSync(
          'src/templates/emails/emailGuest/beta-guest.html',
          'utf-8',
        )
        .replace('[USERNAME]', name.split(' ')[0]);

      subject = 'Você foi convidado para participar de um evento!';
    } else if (type == 'forgotPassword') {
      html = await fs
        .readFileSync(
          'src/templates/emails/emailForgotPassword/index.html',
          'utf-8',
        )
        .replace('[USERNAME]', name.split(' ')[0])
        .replace('[CODE]', code);

      subject = 'Código de verificação para redefinição de senha';
    } else if (type == 'verifyEmail') {
      html = await fs
        .readFileSync('src/templates/emails/verifyEmail/index.html', 'utf-8')
        .replace('[USERNAME]', name.split(' ')[0])
        .replace('[CODE]', code);

      subject = 'Código de verificação do email';
    } else if (type == 'sendEmailParticipantQRcode') {
      html = await fs
        .readFileSync('src/templates/emails/participant/qrcode.html', 'utf-8')
        .replace('[USERNAME]', '')
        .replace('[EVENTNAME]', generatorEmailParticipant.eventName)
        .replace('[TICKETNAME]', generatorEmailParticipant.ticketName)
        .replace('[DESCRIPTION]', generatorEmailParticipant.description)
        .replace('[PASSWORD]', '')
        .replace(
          '[STARTDATE]',
          generatorEmailParticipant.startDate.toDateString(),
        )
        .replace('[ENDDATE]', generatorEmailParticipant.endDate.toDateString())
        .replace('[DAYS]', generatorEmailParticipant.days)
        .replace('[INVICTACLUB]', generatorEmailParticipant.invictaClub);

      subject =
        '[NEX EVENT] QR Code para o evento ' +
        generatorEmailParticipant.eventName +
        ' | ' +
        generatorEmailParticipant.ticketName;
    } else if (type == 'staffGuest') {
      html = await fs
        .readFileSync('src/templates/emails/staff/invite.html', 'utf-8')
        .replace('[EVENTNAME]', generatorEmailParticipant.eventName)
        .replace('[STAFFEMAIL]', generatorEmailParticipant.staffEmail)
        .replace('[STAFFPASSWORD]', generatorEmailParticipant.staffPassword)
        .replaceAll('[URL]', process.env.EMAIL_URL)
        .replaceAll('[EVENTSLUG]', generatorEmailParticipant.eventSlug);

      subject =
        '[NEX EVENT] Acesso para credenciar o evento: ' +
        generatorEmailParticipant.eventName;
    } else {
      throw new NotFoundException('Type of email not found!');
    }

    let message: any = {};
    if (generatorEmailParticipant !== undefined && generatorEmailParticipant) {
      message = {
        from: 'Nex Event ' + from,
        to: to,
        subject: subject,
        html: html,
        attachment: [
          {
            filename: name + '.png',
            data: Buffer.from(
              generatorEmailParticipant.qrCodeHtml.replace(
                /^data:image\/png;base64,/,
                '',
              ),
              'base64',
            ),
          },
        ],
      };
    } else {
      message = {
        from: 'Nex Event ' + from,
        to: to,
        subject: subject,
        html: html,
      };
    }

    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: this.API_KEY,
    });

    try {
      await mg.messages.create(this.DOMAIN, message);
    } catch (error) {
      console.error(`Error sending email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
