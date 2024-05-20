import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventParticipantHistoricStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';

@Injectable()
export class EventProducerAccreditationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly userProducerValidationService: UserProducerValidationService,
  ) {}
  async findByQrCode(userEmail: string, slug: string, qrcode: string) {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail,
      );

      const participant = await this.findOne(event.id, null, qrcode);

      return participant;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }

  async findByFacial(
    userEmail: string,
    slug: string,
    participantPhoto: Express.Multer.File,
  ) {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail,
      );

      const eventParticipants = await this.prisma.eventParticipant.findMany({
        where: {
          eventId: event.id,
        },
        select: {
          qrcode: true,
          user: {
            include: {
              userFacials: true,
            },
          },
        },
      });

      const validationPromises = eventParticipants.map(async (participant) => {
        if (participant.user.userFacials.length > 0) {
          const photo = await this.storageService.getFile(
            StorageServiceType.S3,
            participant.user.userFacials[0].path,
          );

          const valid = await this.storageService.validateFacial(
            participantPhoto.buffer,
            photo,
          );

          if (valid !== false && valid > 90) {
            return participant.qrcode;
          }
        }
      });

      const results = await Promise.all(validationPromises);

      const filteredResults = results.filter((result) => result !== undefined);

      return filteredResults.length > 0 ? filteredResults[0] : false;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }

  async accreditParticipant(
    userEmail: string,
    slug: string,
    participantId: string,
  ) {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail,
      );

      const participant = await this.findOne(event.id, participantId);

      let participantStatus: EventParticipantHistoricStatus = 'CHECK_IN';

      if (
        participant.eventParticipantHistoric.length > 0 &&
        participant.eventParticipantHistoric[0].status === 'CHECK_IN'
      ) {
        participantStatus = 'CHECK_OUT';
      }

      const historic = await this.prisma.eventParticipantHistoric.create({
        data: {
          eventParticipantId: participant.id,
          status: participantStatus,
        },
      });

      return `The participant  ${historic.status} the event`;
    } catch (error) {
      console.log(error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }

  async findOne(eventId: string, participantId?: string, qrcode?: string) {
    const where: Prisma.EventParticipantWhereInput = {
      eventId: eventId,
    };

    if (participantId) {
      where.id = participantId;
    }

    if (qrcode) {
      where.qrcode = qrcode;
    }

    const participant = await this.prisma.eventParticipant.findFirst({
      where,
      include: {
        eventParticipantHistoric: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return participant;
  }
}
