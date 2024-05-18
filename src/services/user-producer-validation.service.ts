import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserValidationEmailResponseDto } from 'src/dtos/user-validation-response.dto';
import { UserValidationEmailResponseSchema } from 'src/schemas/user-validation-response.schema';
import { compareSync } from 'bcrypt';
import { String } from 'aws-sdk/clients/apigateway';

@Injectable()
export class UserProducerValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(
    email: string,
  ): Promise<UserValidationEmailResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        const response: UserValidationEmailResponseDto = {
          id: user.id,
          name: user.name,
          email: user.email,
          dateBirth: user.dateBirth,
          profilePhoto: user.profilePhoto,
          type: user.type,
          cep: user.cep,
          document: user.document,
          phoneCountry: user.phoneCountry,
          phoneNumber: user.phoneNumber,
          street: user.street,
          district: user.district,
          city: user.city,
          complement: user.complement,
          country: user.country,
          createdAt: user.createdAt,
          number: user.number,
          state: user.state,
        };

        await UserValidationEmailResponseSchema.parseAsync(response);

        return response;
      }

      return null;
    } catch (error) {
      throw new ConflictException(error);
    }
  }

  async validateUserProducerByEmail(
    email: string,
    password?: string,
    eventId?: string,
  ): Promise<UserValidationEmailResponseDto> {
    try {
      if (eventId) {
        const staff = await this.prisma.eventStaff.findFirst({
          where: {
            eventId,
            email,
          },
        });

        if (!staff) {
          throw new NotFoundException('Staff not found');
        }

        return staff;
      }
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const response: UserValidationEmailResponseDto = {
        id: user.id,
        name: user.name,
        email: user.email,
        dateBirth: user.dateBirth,
        profilePhoto: user.profilePhoto,
        type: user.type,
        cep: user.cep,
        document: user.document,
        phoneCountry: user.phoneCountry,
        phoneNumber: user.phoneNumber,
        street: user.street,
        district: user.district,
        city: user.city,
        complement: user.complement,
        country: user.country,
        createdAt: user.createdAt,
        number: user.number,
        state: user.state,
      };

      await UserValidationEmailResponseSchema.parseAsync(response);

      if (password) {
        const passwordValid = compareSync(password, user.password);

        if (!passwordValid) {
          throw new UnauthorizedException('Invalid password');
        }

        return response;
      }

      if (
        !user.name ||
        !user.document ||
        !user.phoneCountry ||
        !user.phoneNumber
      ) {
        throw new UnauthorizedException('Finish your registration');
      }

      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(error);
    }
  }

  async eventExists(slug: string, userEmail: String) {
    const event = await this.prisma.event.findUnique({
      where: {
        slug: slug,
      },
      include: {
        eventConfig: true,
        eventTicket: true,
      },
    });

    await this.validateUserProducerByEmail(userEmail, null, event.id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async eventNameExists(userEmail: string, slug: string) {
    const user = await this.validateUserProducerByEmail(userEmail);

    const eventExists = await this.prisma.event.findUnique({
      where: {
        slug: slug,
      },
    });

    if (eventExists) {
      throw new ConflictException('Event name already exists');
    }

    return user;
  }

  async validateUserEventTicket(
    userEmail: string,
    eventSlug: string,
    ticketGuest: number,
    slug?: string,
  ) {
    const event = await this.eventExists(eventSlug, userEmail);

    if (slug) {
      const ticketExists = await this.prisma.eventTicket.findUnique({
        where: {
          eventId_slug: { eventId: event.id, slug },
        },
      });

      if (ticketExists) {
        throw new ConflictException('Ticket name already exists');
      }
    }

    if (ticketGuest > event.eventConfig[0].limit) {
      throw new ConflictException(
        'The quantity must be less than or equal to the event limit',
      );
    }

    return {
      event: event,
      sequential: event.eventTicket.length + 1,
    }; //retorno do sequential do ticket;
  }
}
