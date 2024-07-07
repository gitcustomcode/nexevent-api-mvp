import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserEventParticipantCreateDto } from 'src/dtos/user-validation-response.dto';
import { randomUUID } from 'crypto';
import { EventParticipantStatus } from '@prisma/client';
import { validateCPF } from 'src/utils/cpf-validator';
import { z } from 'nestjs-zod/z';
import { validateEmail } from 'src/utils/email-validator';
import { validateBirth } from 'src/utils/date-validator';

@Injectable()
export class UserParticipantValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string, body: UserEventParticipantCreateDto) {
    try {
      const isEmail = validateEmail(email.toLowerCase());

      if (!isEmail) {
        throw new BadRequestException('Invalid email');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
        include: {
          userFacials: {
            orderBy: { expirationDate: 'desc' },
          },
          userSocials: true,
          userHobbie: true,
        },
      });

      if (!user) {
        const userCreated = await this.createUserEventParticipant(
          email.toLowerCase(),
          body,
        );

        return userCreated;
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async createUserEventParticipant(
    email: string,
    body: UserEventParticipantCreateDto,
  ) {
    const { country, document, name, phoneCountry, phoneNumber, state, city } =
      body;

    const validName = name.trim().split(' ');

    if (validName.length < 2) {
      throw new UnprocessableEntityException('Please provide a complete name');
    }

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        country,
        document: document ? document : null,
        name,
        phoneCountry,
        phoneNumber,
        state,
        city,
      },
      include: {
        userFacials: true,
        userSocials: true,
        userHobbie: true,
      },
    });

    return user;
  }

  async eventTicketPriceExists(eventTicketPriceId: string) {
    const eventTicketPrice = await this.prisma.eventTicketPrice.findUnique({
      where: {
        id: eventTicketPriceId,
      },
      include: {
        EventParticipant: true,
        eventTicket: true,
      },
    });

    const prevBatch = await this.prisma.eventTicketPrice.findFirst({
      where: {
        batch: eventTicketPrice.batch - 1,
        eventTicketId: eventTicketPrice.eventTicketId,
      },
      include: {
        EventParticipant: true,
      },
    });

    if (!eventTicketPrice) {
      throw new NotFoundException('Event Ticket not found');
    }

    if (prevBatch !== null) {
      if (
        (prevBatch.status !== 'FULL' && prevBatch.status !== 'DISABLE') ||
        prevBatch.endPublishAt < new Date()
      ) {
        throw new BadRequestException('The previous batch is still available');
      }
    }

    console.log(new Date());

    if (eventTicketPrice.startPublishAt > new Date()) {
      throw new BadRequestException('The batch not available');
    }

    return eventTicketPrice;
  }

  async updateEventTicketPriceStatus(eventTicketPriceId: string) {
    const eventTicketPrice =
      await this.eventTicketPriceExists(eventTicketPriceId);

    const status =
      eventTicketPrice.guests == eventTicketPrice.EventParticipant.length + 1
        ? 'FULL'
        : 'PART_FULL';

    await this.prisma.eventTicketPrice.update({
      where: {
        id: eventTicketPriceId,
      },
      data: {
        status: status,
      },
    });

    return;
  }

  async eventTicketLinkLimit(eventTicketLinkId: string) {
    const eventTicketLink = await this.prisma.eventTicketLink.findUnique({
      where: {
        id: eventTicketLinkId,
      },
      include: {
        eventParticipant: true,
        eventTicket: true,
        eventTicketPrice: true,
      },
    });

    if (
      eventTicketLink.status === 'FULL' ||
      eventTicketLink.eventTicketPrice.status === 'FULL'
    ) {
      throw new ConflictException('Ticket or Link already full');
    }

    return eventTicketLink;
  }

  async updateEventTicketLinkStatus(eventTicketLinkId: string) {
    const eventTicketLink = await this.eventTicketLinkLimit(eventTicketLinkId);

    const status =
      eventTicketLink.invite == eventTicketLink.eventParticipant.length + 1
        ? 'FULL'
        : 'PART_FULL';

    const eventTicketLinkUpdated = await this.prisma.eventTicketLink.update({
      where: {
        id: eventTicketLinkId,
      },
      data: {
        status: status,
      },
      include: {
        eventTicket: {
          include: {
            event: {
              include: {
                eventConfig: true,
                eventTerm: {
                  include: {
                    term: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await this.updateEventTicketPriceStatus(eventTicketLink.eventTicketPriceId);

    return eventTicketLinkUpdated;
  }

  async userAlreadyUsedTicket(userId: string, eventTicketId: string) {
    const userAlreadyExists = await this.prisma.eventParticipant.findFirst({
      where: {
        userId,
        eventTicketId,
      },
    });

    if (userAlreadyExists) {
      throw new ConflictException('User already used this ticket');
    }

    return;
  }

  async participantExists(eventParticipantId: string) {
    const eventParticipant = await this.prisma.eventParticipant.findUnique({
      where: {
        id: eventParticipantId,
      },
      include: {
        user: {
          include: {
            userFacials: true,
            userSocials: true,
            userHobbie: true,
          },
        },
        event: {
          include: {
            eventConfig: true,
            eventTerm: true,
          },
        },
      },
    });

    if (!eventParticipant) {
      throw new NotFoundException('Participant not found');
    }

    return eventParticipant;
  }
}
