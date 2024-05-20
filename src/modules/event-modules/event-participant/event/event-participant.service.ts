import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventParticipantStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/services/prisma.service';
import { UserParticipantValidationService } from 'src/services/user-participant-validation.service';
import {
  EventParticipantCreateDto,
  EventParticipantCreateNetworksDto,
} from './dto/event-participant-create.dto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from 'src/services/email.service';
import * as QRCode from 'qrcode';
import { ParticipantTicketDto } from './dto/event-participant-response.dto';

@Injectable()
export class EventParticipantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userParticipantValidationService: UserParticipantValidationService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
  ) {}

  async createParticipant(
    userEmail: string,
    eventTicketLinkId: string,
    body: EventParticipantCreateDto,
  ) {
    try {
      const user = await this.userParticipantValidationService.findUserByEmail(
        userEmail,
        body,
      );

      const eventTicketLink =
        await this.userParticipantValidationService.updateEventTicketLinkStatus(
          eventTicketLinkId,
        );

      await this.userParticipantValidationService.userAlreadyUsedTicket(
        user.id,
        eventTicketLink.eventTicketId,
      );

      const event = eventTicketLink.eventTicket.event;

      const qrcode = randomUUID();

      const sequential = await this.prisma.eventParticipant.count({
        where: {
          eventId: eventTicketLink.eventTicket.eventId,
        },
      });

      const participantStatus = await this.updateUserParticipantStatus(
        event,
        user,
      );

      const eventParticipant = await this.prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          eventTicketLinkId: eventTicketLink.id,
          eventTicketId: eventTicketLink.eventTicket.id,
          qrcode,
          sequential: sequential + 1,
          userId: user.id,
          status: participantStatus,
        },
      });

      return {
        eventParticipantId: eventParticipant.id,
        participantStatus: eventParticipant.status,
      };
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

  async createParticipantFacial(
    participantId: string,
    photo: Express.Multer.File,
  ) {
    try {
      const participantExists =
        await this.userParticipantValidationService.participantExists(
          participantId,
        );

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (!allowedMimeTypes.includes(photo.mimetype)) {
        throw new BadRequestException(
          'Only JPEG, JPG and PNG files are allowed.',
        );
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear().toString();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');

      const filename = photo.originalname;
      const fileExtension = filename.split('.').pop();

      const uniqueFilename = `${randomUUID()}.${fileExtension}`;

      const filePath = `user-face/${year}/${month}/${day}/${uniqueFilename}`;

      await this.storageService.uploadFile(
        StorageServiceType.S3,
        filePath,
        photo.buffer,
      );

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 60);

      await this.prisma.userFacial.create({
        data: {
          userId: participantExists.userId,
          path: filePath,
          expirationDate: expiryDate,
        },
      });

      const userUpdated = await this.prisma.user.findUnique({
        where: {
          id: participantExists.userId,
        },
        include: {
          userFacials: true,
          userSocials: true,
          userHobbie: true,
        },
      });

      const participantStatus = await this.updateUserParticipantStatus(
        participantExists.event,
        userUpdated,
      );

      const participantUpdated = await this.prisma.eventParticipant.update({
        where: {
          id: participantExists.id,
        },
        data: {
          status: participantStatus,
        },
      });

      return {
        eventParticipantId: participantUpdated.id,
        participantStatus: participantUpdated.status,
      };
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

  async createParticipantNetworks(
    participantId: string,
    body: EventParticipantCreateNetworksDto,
  ) {
    try {
      const participantExists =
        await this.userParticipantValidationService.participantExists(
          participantId,
        );

      const userSocialsFormatted = body.map((network) => {
        return {
          userId: participantExists.user.id,
          network: network.network,
          username: network.username,
        };
      });

      await this.prisma.userSocial.deleteMany({
        where: {
          userId: participantExists.user.id,
        },
      });

      await this.prisma.userSocial.createMany({
        data: userSocialsFormatted,
      });

      const userUpdated = await this.prisma.user.findUnique({
        where: {
          id: participantExists.userId,
        },
        include: {
          userFacials: true,
          userSocials: true,
          userHobbie: true,
        },
      });

      const participantStatus = await this.updateUserParticipantStatus(
        participantExists.event,
        userUpdated,
      );

      const participantUpdated = await this.prisma.eventParticipant.update({
        where: {
          id: participantExists.id,
        },
        data: {
          status: participantStatus,
        },
      });

      return {
        eventParticipantId: participantUpdated.id,
        participantStatus: participantUpdated.status,
      };
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

  async updateUserParticipantStatus(event, user) {
    let participantStatus: EventParticipantStatus = 'COMPLETE';

    const eventConfig = event.eventConfig[0];

    if (eventConfig.participantNetworks && user.userSocials.length <= 0) {
      return (participantStatus = 'AWAITING_QUIZ');
    } else if (event.eventTerm.length > 0) {
      return (participantStatus = 'AWAITING_SIGNATURE');
    } else if (
      eventConfig.credentialType === 'FACIAL' ||
      eventConfig.credentialType === 'FACIAL_IN_SITE' ||
      user.userFacials.length <= 0 ||
      user.userFacials[0].expirationDate < new Date()
    ) {
      return (participantStatus = 'AWAITING_FACIAL');
    }

    return participantStatus;
  }

  async participantTicket(
    participantId: string,
  ): Promise<ParticipantTicketDto> {
    try {
      const participant = await this.prisma.eventParticipant.findUnique({
        where: {
          id: participantId,
        },
        include: {
          eventTicket: true,
          event: true,
        },
      });

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const response: ParticipantTicketDto = {
        id: participant.id,
        ticketName: participant.eventTicket.title,
        price: Number(participant.eventTicket.price),
        eventName: participant.event.title,
        qrcode: participant.qrcode,
        startAt: participant.event.startAt,
      };

      return response;
    } catch (error) {
      throw error;
    }
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
      const { name, email, document } = user;
      const { startAt, endAt, description, title: nameEvent } = event;
      const { title: nameTicket } = eventTicket;

      const qrCodeBase64 = await QRCode.toDataURL(eventParticipant.qrcode);

      const data = {
        to: email,
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
      });

      await this.prisma.eventParticipant.update({
        where: { id: eventParticipant.id },
        data: { sendEmailAt: new Date() },
      });
    });
  }
}
