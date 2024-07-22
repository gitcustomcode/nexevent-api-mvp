import {  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationService } from 'src/services/paginate.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventProducerCreateStaffDto } from './dto/event-producer-create-staff.dto';
import {
  EventProducerRecommendedStaffs,
  EventStaffsResponse,
} from './dto/event-producer-response-staff.dto';
import { Prisma } from '@prisma/client';
import { genSaltSync, hash } from 'bcrypt';
import { EmailService } from 'src/services/email.service';

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

      const staffAlreadyExists = await this.prisma.eventStaff.findFirst({
        where: {
          eventId: event.id,
          email: email.toLowerCase(),
        },
      });

      if (staffAlreadyExists)
        throw new ConflictException(
          'This email is already registered with the team for this event',
        );

      const userExists = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      await this.prisma.eventStaff.create({
        data: {
          eventId: event.id,
          email: email.toLowerCase(),
          userId: userExists ? userExists.id : null,
          status: userExists ? 'USER_NOT_ACCEPTED' : 'NOT_USER',
        },
      });

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
            staffName: staff.user?.name,
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

  /* async updateEventStaff(
    userEmail: string,
    eventSlug: string,
    staffId: string,
    staffEmail: string,
    staffPassword: string,
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

      if (staffEmail) {
        const staffEmailExists = await this.prisma.eventStaff.findFirst({
          where: {
            email: staffEmail.toLowerCase(),
            eventId: event.id,
          },
        });

        if (staffEmailExists) {
          throw new ConflictException(`Staff already exists`);
        }
      }

      let hashedPassword = null;

      if (staffPassword) {
        const salt = genSaltSync(10);
        hashedPassword = await hash(staffPassword, salt);
      }

      await this.prisma.eventStaff.update({
        where: {
          id: staffId,
          eventId: event.id,
        },
        data: {
          email: staffEmail
            ? staffEmail.toLowerCase()
            : staffExists.email.toLowerCase(),
          password:
            hashedPassword !== null ? hashedPassword : staffExists.password,
        },
      });

      return `Staff updated successfully`;
    } catch (error) {
      throw error;
    }
  } */

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
