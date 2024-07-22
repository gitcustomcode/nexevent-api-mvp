import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationService } from 'src/services/paginate.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventProducerCreateStaffDto } from './dto/event-producer-create-staff.dto';
import { EventStaffsResponse } from './dto/event-producer-response-staff.dto';
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

      const staffsFormattedPromises = body.map(async (staff) => {
        const salt = genSaltSync(10);
        const hashedPassword = await hash(staff.password, salt);
        return {
          eventId: event.id,
          email: staff.email.toLowerCase(),
          password: hashedPassword,
          originalPassword: staff.password,
        };
      });

      const staffsFormatted = await Promise.all(staffsFormattedPromises);

      const staffsExists = await this.prisma.eventStaff.findMany({
        where: {
          eventId: event.id,
        },
      });

      const existingEmails = new Set(staffsExists.map((staff) => staff.email));

      const staffsToInsert = staffsFormatted.filter(
        (staff) => !existingEmails.has(staff.email.toLowerCase()),
      );

      if (staffsToInsert.length > 0) {
        const staffs = staffsToInsert.map((staff) => {
          return {
            eventId: event.id,
            email: staff.email.toLowerCase(),
            password: staff.password,
          };
        });

        await this.prisma.eventStaff.createMany({
          data: staffs,
        });

        staffsToInsert.map(async (staff) => {
          const data = {
            to: staff.email.toLowerCase(),
            name: staff.email,
            type: 'staffGuest',
          };

          await this.emailService.sendEmail(data, {
            description: '',
            endDate: new Date(),
            eventName: event.title,
            eventSlug: event.slug,
            invictaClub: '',
            qrCode: '',
            qrCodeHtml: '',
            staffEmail: staff.email.toLowerCase(),
            staffPassword: staff.originalPassword,
            startDate: new Date(),
            ticketName: '',
          });
        });
        return `Event Staff created successfully`;
      } else {
        return 'Nenhum novo staff para inserir.';
      }
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
