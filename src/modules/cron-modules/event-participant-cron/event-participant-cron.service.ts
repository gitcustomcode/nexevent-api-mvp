import { Cron, CronExpression } from '@nestjs/schedule';import { PrismaService } from 'src/services/prisma.service';
import { EventParticipant, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { EmailService } from 'src/services/email.service';

@Injectable()
export class EventParticipantCronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'eventParticipantsNotPaymentBy10Minutes',
  })
  async deleteParticipantsNotPaymentsBy10Minutes() {
    const dateMinus10Minutes = new Date(Date.now() - 10 * 60 * 1000);

    const usersNotPaymentBy10Minutes: EventParticipant[] =
      await this.prisma.eventParticipant.findMany({
        where: {
          createdAt: {
            lt: dateMinus10Minutes,
          },
          deletedAt: null,
          status: {
            equals: 'AWAITING_PAYMENT',
          },
        },
      });

    if (usersNotPaymentBy10Minutes.length === 0) {
      return;
    }

    try {
      await Promise.all(
        usersNotPaymentBy10Minutes.map(async (user) => {
          await this.prisma.eventTicketLink.updateMany({
            where: {
              eventTicketPriceId: user.eventTicketPriceId,
              userId: user.userId,
            },
            data: {
              status: 'FULL',
            },
          });

          await this.prisma.eventParticipant.updateMany({
            where: {
              id: user.id,
            },
            data: {
              deletedAt: new Date(),
            },
          });
        }),
      );
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'disableEventsThatArrivedOnTheEndDate',
  })
  async disableEventsThatArrivedOnTheEndDate() {
    const today = new Date();

    const events = await this.prisma.event.findMany({
      where: {
        status: 'ENABLE',
        endAt: {
          lt: today,
        },
      },
      take: 10,
    });

    if (events.length === 0) {
      return;
    }

    const arrIDs = [];

    events.forEach((event) => {
      arrIDs.push(event.id);
    });

    await this.prisma.event.updateMany({
      where: {
        id: { in: arrIDs },
      },
      data: {
        status: 'DISABLE',
      },
    });

    return;
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'deleteExpiredUserFacial',
  })
  async deleteExpiredUserFacial() {
    const today = new Date();

    const faces = await this.prisma.userFacial.findMany({
      where: {
        expirationDate: {
          lt: today,
        },
      },
      take: 10,
    });

    if (faces.length === 0) {
      return;
    }

    const arrIDs = [];

    faces.forEach((face) => {
      arrIDs.push(face.id);
    });

    await this.prisma.userFacial.deleteMany({
      where: {
        id: { in: arrIDs },
      },
    });

    return;
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'eventParticipantSendEmails',
  })
  async sendCronEmail() {
    const eventParticipants = await this.prisma.eventParticipant.findMany({
      where: {
        sendEmailAt: null,
      },
      take: 1,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            document: true,
          },
        },
        event: {
          select: {
            title: true,
            startAt: true,
            endAt: true,
            description: true,
          },
        },
        eventTicket: {
          select: {
            title: true,
          },
        },
      },
    });

    eventParticipants.forEach(async (eventParticipant) => {
      const { user, event, eventTicket } = eventParticipant;
      const { name, email } = user;
      const { startAt, endAt, description, title: nameEvent } = event;
      const { title: nameTicket } = eventTicket;

      const qrCodeBase64 = await QRCode.toDataURL(eventParticipant.qrcode);

      const data = {
        to: email.toLowerCase(),
        name: name,
        type: 'sendEmailParticipantQRcode',
      };

      this.emailService.sendEmail(data, {
        eventName: nameEvent,
        ticketName: nameTicket,
        description: description,
        startDate: startAt,
        endDate: endAt,
        qrCodeHtml: qrCodeBase64,
        qrCode: eventParticipant.qrcode,
        invictaClub: '',
        eventSlug: '',
        staffEmail: '',
        staffPassword: '',
      });

      await this.prisma.eventParticipant.update({
        where: { id: eventParticipant.id },
        data: { sendEmailAt: new Date() },
      });
    });
  }
}
