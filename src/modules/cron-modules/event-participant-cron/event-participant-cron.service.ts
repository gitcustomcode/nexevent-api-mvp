import { Cron, CronExpression } from '@nestjs/schedule';import { PrismaService } from 'src/services/prisma.service';
import { EventParticipant, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { dateString } from 'nestjs-zod/z';

@Injectable()
export class EventParticipantCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
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
          status: {
            equals: 'AWAITING_PAYMENT',
          },
        },
      });

    const idsToDelete = usersNotPaymentBy10Minutes.map((user) => user.id);

    await this.prisma.eventParticipant.updateMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    console.log(
      `Deleted ${idsToDelete.length} participants not paid by 10 minutes.`,
    );
  }
}
