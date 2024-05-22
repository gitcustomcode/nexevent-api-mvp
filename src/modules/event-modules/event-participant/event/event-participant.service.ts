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
import {
  FindAllPublicEvents,
  FindEventInfoDto,
  FindOnePublicEventsDto,
  ParticipantTicketDto,
} from './dto/event-participant-response.dto';
import { ClickSignApiService } from 'src/services/click-sign.service';
import * as mime from 'mime-types';
import { Prisma } from '@prisma/client';
import { PaginationService } from 'src/services/paginate.service';
import { validateCPF } from 'src/utils/cpf-validator';
import { FaceValidationService } from 'src/services/face-validation.service';

@Injectable()
export class EventParticipantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userParticipantValidationService: UserParticipantValidationService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly clickSignApiService: ClickSignApiService,
    private readonly paginationService: PaginationService,
    private readonly faceValidationService: FaceValidationService,
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

      let signerInfo = null;

      if (event.eventTerm.length > 0 && event.eventTerm[0].signature) {
        const signer = await this.createTermSignatorie(user.id);

        const res = await this.addTermSigner(
          signer.id,
          event.eventTerm[0].term.path,
        );

        signerInfo = res.clickSignResponseSigner;
      }

      const eventParticipant = await this.prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          eventTicketLinkId: eventTicketLink.id,
          eventTicketId: eventTicketLink.eventTicket.id,
          qrcode,
          sequential: sequential + 1,
          userId: user.id,
          status: participantStatus,
          signerId: signerInfo ? signerInfo.list.signer_key : null,
          documentSignerId: signerInfo ? signerInfo.list.document_key : null,
          requestSignatureKey: signerInfo
            ? signerInfo.list.request_signature_key
            : null,
        },
      });

      return {
        eventParticipantId: eventParticipant.id,
        participantStatus: eventParticipant.status,
        requestSignatureKey: eventParticipant.requestSignatureKey,
      };
    } catch (error) {
      throw error;
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

      const res = await this.faceValidationService.validateWithFacial(photo);

      if (res && res.email !== participantExists.user.email) {
        throw new BadRequestException(
          `This face is already associated with other participant`,
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
      throw error;
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
      throw error;
    }
  }

  async updateUserParticipantStatus(event, user) {
    let participantStatus: EventParticipantStatus = 'COMPLETE';

    const eventConfig = event.eventConfig[0];

    const eventParticipant = await this.prisma.eventParticipant.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
      },
    });

    if (
      eventParticipant &&
      eventParticipant.signerId !== null &&
      eventParticipant.signature !== true
    ) {
      return (participantStatus = 'AWAITING_SIGNATURE');
    }

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

  async findEventInfo(eventTicketLinkId: string): Promise<FindEventInfoDto> {
    try {
      const eventInfo = await this.prisma.eventTicketLink.findUnique({
        where: {
          id: eventTicketLinkId,
        },
        include: {
          eventTicket: {
            include: {
              event: {
                include: {
                  eventTerm: true,
                },
              },
            },
          },
        },
      });

      const response: FindEventInfoDto = {
        id: eventInfo.eventTicket.event.id,
        title: eventInfo.eventTicket.event.title,
        startAt: eventInfo.eventTicket.event.startAt,
        haveDocument:
          eventInfo.eventTicket.event.eventTerm.length > 0 ? true : false,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findAllPublicEvents(
    page: number,
    perPage: number,
    title?: string,
    category?: string,
  ): Promise<FindAllPublicEvents> {
    try {
      const where: Prisma.EventWhereInput = {
        public: true,
      };

      if (title) {
        where.title = { contains: title, mode: 'insensitive' };
      }

      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
      }

      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(perPage),
        skip: (page - 1) * Number(perPage),
      });

      const totalItems = await this.prisma.event.count({ where });

      const pagination = await this.paginationService.paginate({
        page,
        perPage: perPage,
        totalItems,
      });

      const eventsFormatted = events.map((event) => {
        return {
          id: event.id,
          title: event.title,
          slug: event.slug,
          photo: event.photo,
          category: event.category,
          description: event.description,
          startAt: event.startAt,
          endAt: event.endAt,
        };
      });

      const response: FindAllPublicEvents = {
        data: eventsFormatted,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findOnePublicEvent(slug: string): Promise<FindOnePublicEventsDto> {
    try {
      const event = await this.prisma.event.findUnique({
        where: {
          slug,
        },
        include: {
          eventTicket: true,
        },
      });

      const response: FindOnePublicEventsDto = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        photo: event.photo,
        category: event.category,
        description: event.description,
        startAt: event.startAt,
        endAt: event.endAt,
        ticket: event.eventTicket.map((ticket) => {
          return {
            id: ticket.id,
            title: ticket.title,
            price: Number(ticket.price),
            description: ticket.description,
          };
        }),
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  private async createTermSignatorie(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const termSignatorie = await this.prisma.termSignatorie.findFirst({
        where: {
          userId: userId,
          auths: 'whatsapp',
        },
      });

      if (termSignatorie) {
        return termSignatorie;
      }

      const clickSignResponse = await this.clickSignApiService.createSigner(
        user.email,
        user.phoneNumber,
        user.name,
        user.document,
        user.dateBirth.toString(),
      );

      const termSignatorieCreate = await this.prisma.termSignatorie.create({
        data: {
          id: clickSignResponse.signer.key,
          userId: userId,
        },
      });

      return termSignatorieCreate;
    } catch (error) {
      throw error;
    }
  }

  private async addTermSigner(signerId: string, documentPath: string) {
    try {
      const signer = await this.prisma.termSignatorie.findUnique({
        where: {
          id: signerId,
        },
      });

      if (!signer) {
        throw new NotFoundException('Signer not found');
      }

      const file = await this.storageService.getFile(
        StorageServiceType.S3,
        documentPath,
      );

      const fileBase64 = file.toString('base64');
      const mimeType = mime.lookup(documentPath) || 'application/octet-stream';

      console.log(`MIME type: ${mimeType}`);

      const contentBase64 = `data:${mimeType};base64,${fileBase64}`;

      const clickSignResponseDoc = await this.clickSignApiService.postDocument(
        '/' + signer.id + '/' + documentPath,
        contentBase64,
      );

      const clickSignResponseSigner =
        await this.clickSignApiService.addSignerDocument(
          clickSignResponseDoc.document.key,
          signer.id,
        );

      return { clickSignResponseSigner };
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
      const { name, email } = user;
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
