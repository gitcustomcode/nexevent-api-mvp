import {  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaginationService } from 'src/services/paginate.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventProducerCreateStaffDto } from './dto/event-producer-create-staff.dto';
import {
  EventProducerRecommendedStaffs,
  EventStaffsResponse,
  ResponseStaffEvents,
} from './dto/event-producer-response-staff.dto';
import { Prisma } from '@prisma/client';
import { genSaltSync, hash } from 'bcrypt';
import { EmailService } from 'src/services/email.service';
import { ResponseEvents } from '../event/dto/event-producer-response.dto';

@Injectable()
export class EventProducerStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly paginationService: PaginationService,
    private readonly emailService: EmailService,
  ) {}

  async createStaff(
    userEmail: string,
    eventSlug: string,
    body: EventProducerCreateStaffDto,
  ): Promise<string> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      if (!event) throw new NotFoundException('Event not found');

      const { email } = body;

      if (!email) throw new NotFoundException('Email sent empty');

      if (userEmail.toLowerCase() === email.toLowerCase()) {
        throw new UnprocessableEntityException(
          'This user is the producer of this event',
        );
      }

      const staffAlreadyExists = await this.prisma.eventStaff.findFirst({
        where: {
          eventId: event.id,
          email: email.toLowerCase(),
        },
      });

      if (staffAlreadyExists && staffAlreadyExists.status !== 'USER_REFUSED')
        throw new ConflictException(
          'This email is already registered with the team for this event',
        );

      const userExists = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (staffAlreadyExists && staffAlreadyExists.status === 'USER_REFUSED') {
        await this.prisma.eventStaff.update({
          where: {
            id: staffAlreadyExists.id,
          },
          data: {
            status: 'USER_NOT_ACCEPTED',
          },
        });
      } else {
        await this.prisma.eventStaff.create({
          data: {
            eventId: event.id,
            email: email.toLowerCase(),
            userId: userExists ? userExists.id : null,
            status: userExists ? 'USER_NOT_ACCEPTED' : 'NOT_USER',
          },
        });
      }

      if (userExists) {
        await this.emailService.sendInviteStaffUserAlreadyExists(
          email.toLowerCase(),
          {
            eventName: event.title,
            eventSlug: event.slug,
            staffEmail: userExists.email.toLowerCase(),
            staffName: userExists.name,
          },
        );
      } else {
        await this.emailService.sendInviteStaffUserNoExists(
          email.toLowerCase(),
          {
            eventName: event.title,
            eventSlug: event.slug,
            staffEmail: email.toLowerCase(),
          },
        );
      }

      return 'staff created successfully';
    } catch (error) {
      throw error;
    }
  }

  async listEventStaff(
    userEmail: string,
    eventSlug: string,
    page: number,
    perPage: number,
    staffEmail?: string,
  ): Promise<EventStaffsResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const where: Prisma.EventStaffWhereInput = {
        eventId: event.id,
        deletedAt: null,
      };

      if (staffEmail) {
        where.email = { contains: staffEmail, mode: 'insensitive' };
      }

      const eventStaffs = await this.prisma.eventStaff.findMany({
        where,
        skip: (page - 1) * perPage,
        take: Number(perPage),
      });

      const totalItems = await this.prisma.eventStaff.count({
        where,
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const response: EventStaffsResponse = {
        data: eventStaffs.map((staff) => {
          return {
            id: staff.id,
            email: staff.email.toLowerCase(),
            status: staff.status,
          };
        }),

        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async recommendStaffs(
    userId: string,
    page: number,
    perPage: number,
    staffName?: string,
    staffEmail?: string,
    eventTitle?: string,
  ): Promise<EventProducerRecommendedStaffs> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExist) throw new NotFoundException('User not found');

      const where: Prisma.EventStaffWhereInput = {
        event: {
          userId: userExist.id,
        },
        status: 'USER_ACCEPTED',
      };

      if (staffEmail) {
        where.email = { contains: staffEmail, mode: 'insensitive' };
      }

      if (staffName) {
        where.user = {
          name: { contains: staffName, mode: 'insensitive' },
        };
      }

      if (eventTitle) {
        where.event = {
          title: { contains: eventTitle, mode: 'insensitive' },
        };
      }

      const eventStaffs = await this.prisma.eventStaff.findMany({
        where,
        include: {
          user: true,
          event: true,
        },
      });

      // Agrupar registros com o mesmo userId
      const staffMap = new Map<
        string,
        {
          staffId: string;
          staffEmail: string;
          staffName: string;
          eventCount: number;
          events: {
            eventId: string;
            eventTitle: string;
            eventDate: Date;
          }[];
        }
      >();

      eventStaffs.forEach((staff) => {
        const userId = staff.userId;
        const event = {
          eventId: staff.event.id,
          eventTitle: staff.event.title,
          eventDate: staff.event.startAt, // Assuming event.date is a Date object
        };

        if (staffMap.has(userId)) {
          const existingStaff = staffMap.get(userId);
          existingStaff.eventCount++;
          existingStaff.events.push(event);
        } else {
          staffMap.set(userId, {
            staffId: staff.id,
            staffEmail: staff.email.toLowerCase(),
            staffName: staff.user?.name ? staff.user.name : null,
            eventCount: 1,
            events: [event],
          });
        }
      });

      // Convertendo o Map para array e aplicando paginação
      const unifiedStaffs = Array.from(staffMap.values());
      const paginatedStaffs = unifiedStaffs.slice(
        (page - 1) * perPage,
        page * perPage,
      );

      const totalItems = unifiedStaffs.length;

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const response: EventProducerRecommendedStaffs = {
        data: paginatedStaffs,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async staffEvents(
    userId: string,
    page: number,
    perPage: number,
    searchable?: string,
  ): Promise<ResponseStaffEvents> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExist) throw new NotFoundException('User not found');

      const where: Prisma.EventStaffWhereInput = {
        userId: userExist.id,
        status: { not: 'USER_REFUSED' },
        deletedAt: null,
      };

      if (searchable) {
        where.event = {
          fullySearch: { contains: searchable, mode: 'insensitive' },
        };
      }

      const eventsStaff = await this.prisma.eventStaff.findMany({
        where,
        include: {
          user: true,
          event: true,
        },
        orderBy: {
          event: {
            startAt: 'desc',
          },
        },
        skip: (page - 1) * perPage,
        take: Number(perPage),
      });

      const totalItems = await this.prisma.eventStaff.count({ where });

      const pagination = await this.paginationService.paginate({
        page,
        perPage: perPage,
        totalItems,
      });

      const response: ResponseStaffEvents = {
        data: eventsStaff.map((staff) => {
          return {
            id: staff.event.id,
            photo: staff.event.photo,
            slug: staff.event.slug,
            startAt: staff.event.startAt,
            title: staff.event.title,
            status: staff.status,
          };
        }),

        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateEventStaff(
    userId: string,
    eventSlug: string,
    acceptedInvite: boolean,
  ): Promise<string> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExist) throw new NotFoundException('User not found');

      const eventExists = await this.prisma.event.findUnique({
        where: {
          slug: eventSlug,
        },
      });

      if (!eventExists) throw new NotFoundException('Event not found');

      const staffExists = await this.prisma.eventStaff.findFirst({
        where: {
          eventId: eventExists.id,
          userId: userExist.id,
        },
      });

      await this.prisma.eventStaff.update({
        where: {
          id: staffExists.id,
        },
        data: {
          status: acceptedInvite ? 'USER_ACCEPTED' : 'USER_REFUSED',
        },
      });

      return `Staff ${acceptedInvite ? 'accepted invite.' : 'refused invite.'}`;
    } catch (error) {
      throw error;
    }
  }

  async resendInviteEmail(userEmail: string, staffId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: userEmail.toLowerCase(),
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const staff = await this.prisma.eventStaff.findUnique({
      where: {
        id: staffId,
        event: {
          userId: user.id,
        },
      },
      include: {
        event: true,
        user: true,
      },
    });

    if (!staff) throw new NotFoundException('Staff not found');

    await this.prisma.eventStaff.update({
      where: {
        id: staff.id,
      },
      data: {
        status: staff.userId ? 'USER_NOT_ACCEPTED' : 'NOT_USER',
      },
    });

    if (staff.userId) {
      await this.emailService.sendInviteStaffUserAlreadyExists(staff.email, {
        eventName: staff.event.title,
        eventSlug: staff.event.slug,
        staffEmail: staff.email,
        staffName: staff.user.name,
      });
    } else {
      await this.emailService.sendInviteStaffUserNoExists(staff.email, {
        eventName: staff.event.title,
        eventSlug: staff.event.slug,
        staffEmail: staff.email,
      });
    }

    return 'Email sent';
  }

  async deleteEventStaff(
    userEmail: string,
    eventSlug: string,
    staffId: string,
  ): Promise<string> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        eventSlug,
        userEmail.toLowerCase(),
      );

      const staffExists = await this.prisma.eventStaff.findUnique({
        where: {
          id: staffId,
          eventId: event.id,
        },
      });

      const userProducer = await this.prisma.user.findUnique({
        where: {
          id: event.userId,
        },
      });

      if (!staffExists) throw new NotFoundException('Staff not found');

      if (staffExists.email === userProducer.email) {
        throw new BadRequestException(
          'Não é possivel deletar o produtor do evento da equipe',
        );
      }

      await this.prisma.eventStaff.delete({
        where: {
          id: staffId,
          eventId: event.id,
        },
      });

      return `Staff deleted successfully`;
    } catch (error) {
      throw error;
    }
  }
}
