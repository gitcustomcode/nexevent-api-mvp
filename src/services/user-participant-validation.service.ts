import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserEventParticipantCreateDto } from 'src/dtos/user-validation-response.dto';
import { randomUUID } from 'crypto';
import { EventParticipantStatus } from '@prisma/client';
import { validateCPF } from 'src/utils/cpf-validator';
import { z } from 'nestjs-zod/z';
import { validateEmail } from 'src/utils/email-validator';

@Injectable()
export class UserParticipantValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string, body: UserEventParticipantCreateDto) {
    try {
      const isEmail = validateEmail(email);

      if (!isEmail) {
        throw new BadRequestException('Invalid email');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
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
        const userCreated = await this.createUserEventParticipant(email, body);

        return userCreated;
      }
      if (body.document) {
        const documentValid = validateCPF(body.document);
        if (!documentValid) {
          throw new BadRequestException('Invalid CPF document');
        }
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
    const {
      cep,
      country,
      dateBirth,
      document,
      name,
      phoneCountry,
      phoneNumber,
      state,
    } = body;

    const documentValid = validateCPF(document);

    if (!documentValid) {
      throw new BadRequestException('Invalid CPF document');
    }

    const validName = name.trim().split(' ');

    if (validName.length < 2) {
      throw new BadRequestException('Please provide a complete name');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        cep,
        country,
        dateBirth,
        document,
        name,
        phoneCountry,
        phoneNumber,
        state,
      },
      include: {
        userFacials: true,
        userSocials: true,
        userHobbie: true,
      },
    });

    return user;
  }

  async eventTicketExists(eventTicketId: string) {
    const eventTicket = await this.prisma.eventTicket.findUnique({
      where: {
        id: eventTicketId,
      },
      include: {
        EventParticipant: true,
      },
    });

    if (!eventTicket) {
      throw new NotFoundException('Event Ticket not found');
    }

    return eventTicket;
  }

  async updateEventTicketStatus(eventTicketId: string) {
    const eventTicket = await this.eventTicketExists(eventTicketId);

    const status =
      eventTicket.guest == eventTicket.EventParticipant.length + 1
        ? 'FULL'
        : 'PART_FULL';

    await this.prisma.eventTicket.update({
      where: {
        id: eventTicketId,
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
      },
    });

    if (
      eventTicketLink.status === 'FULL' ||
      eventTicketLink.eventTicket.status === 'FULL'
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

    await this.updateEventTicketStatus(eventTicketLink.eventTicketId);

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
