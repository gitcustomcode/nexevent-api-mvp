import {  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventParticipantStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/services/prisma.service';
import { UserParticipantValidationService } from 'src/services/user-participant-validation.service';
import {
  CreateParticipantQuizDto,
  EventParticipantCreateDto,
  EventParticipantCreateNetworksDto,
  EventTicketSellDto,
} from './dto/event-participant-create.dto';
import {
  StorageService,
  StorageServiceType,
} from 'src/services/storage.service';
import {
  FindAllPublicEvents,
  FindEventInfoDto,
  FindOnePublicEventsDto,
  ListTickets,
  ListTicketsDto,
  ParticipantTicketDto,
  EventTicketInfoDto,
  NetworkParticipantDto,
  FindAllPublicEventsDto,
  NetworkHistoric,
  NetworkHistoricDto,
  FindByEmailDto,
  ThanksScreenDto,
  QuizDto,
  QuizQuestionDto,
  QuizCreateResponseDto,
  FindTicketByLinkResponseDto,
  UserIsParticipantInEventByLinkIdResponseDto,
  ParticipantSocialNetworks,
  ParticipantSocialNetworDto,
} from './dto/event-participant-response.dto';
import { ClickSignApiService } from 'src/services/click-sign.service';
import * as mime from 'mime-types';
import { Prisma } from '@prisma/client';
import { PaginationService } from 'src/services/paginate.service';
import { FaceValidationService } from 'src/services/face-validation.service';
import { StripeService } from 'src/services/stripe.service';
import { CheckoutSessionEventParticipantDto } from 'src/dtos/stripe.dto';
import { concatTitleAndCategoryEvent } from 'src/utils/concat-title-category-event';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventParticipantService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userParticipantValidationService: UserParticipantValidationService,
    private readonly storageService: StorageService,
    private readonly clickSignApiService: ClickSignApiService,
    private readonly paginationService: PaginationService,
    private readonly faceValidationService: FaceValidationService,
    private readonly stripe: StripeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('app.jwtSecret');
  }

  async createParticipant(
    userEmail: string,
    eventTicketLinkId: string,
    body: EventParticipantCreateDto,
    updateUser: boolean,
  ) {
    try {
      const user = await this.userParticipantValidationService.findUserByEmail(
        userEmail.toLowerCase(),
        body,
      );

      if (updateUser) {
        const {
          city,
          country,
          document,
          name,
          phoneCountry,
          phoneNumber,
          state,
        } = body;

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: name,
            phoneNumber: phoneNumber,
            document: document ? document : user.document,
            phoneCountry: phoneCountry,
            city: city,
            state: state,
            country: country,
          },
        });
      }

      const eventTicketLink =
        await this.userParticipantValidationService.updateEventTicketLinkStatus(
          eventTicketLinkId,
        );

      const haveBonusTicket = await this.prisma.eventTicketBonus.findMany({
        where: {
          eventTicketId: eventTicketLink.eventTicketId,
        },
      });

      await Promise.all(
        haveBonusTicket.map(async (bonus) => {
          const ticketBonus = await this.prisma.eventTicket.findFirst({
            where: {
              title: bonus.eventTicketBonusTitle,
            },
            include: {
              eventTicketPrice: true,
            },
          });

          if (ticketBonus) {
            await this.prisma.eventTicketLink.create({
              data: {
                eventTicketId: ticketBonus.id,
                userId: user.id,
                isBonus: true,
                invite: bonus.qtd,
              },
            });
          }
        }),
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

      let signerInfo = false;

      if (event.eventTerm.length > 0 && event.eventTerm[0].signature) {
        if (event.eventTerm && !user.validAt) {
          throw new ConflictException(
            'O evento requer que o participante seja verificado',
          );
        }
        signerInfo = true;
      }

      const fully = concatTitleAndCategoryEvent(
        event.title,
        eventTicketLink.eventTicket.title,
      );

      const eventParticipant = await this.prisma.eventParticipant.create({
        data: {
          fullySearch: fully,
          eventId: event.id,
          eventTicketLinkId: eventTicketLink.id,
          eventTicketPriceId: eventTicketLink.eventTicketPriceId
            ? eventTicketLink.eventTicketPriceId
            : null,
          eventTicketId: eventTicketLink.eventTicketId,
          qrcode,
          sequential: sequential + 1,
          userId: user.id,
          status: 'COMPLETE',
          signature: signerInfo,
        },
      });

      await this.createParticipantNetworks(eventParticipant.id, body.networks);

      const loginUser = await this.prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

      delete loginUser.password;

      const payload = { user: loginUser };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
      });

      return {
        eventParticipantId: eventParticipant.id,
        participantStatus: eventParticipant.status,
        accessToken: accessToken,
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

      const validFace = await this.storageService.isFaceValid(photo.buffer);

      if (!validFace.isValid) {
        throw new UnprocessableEntityException(
          'A foto não possui um rosto, por favor tente novamente',
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

      const participantUpdated = await this.prisma.eventParticipant.update({
        where: {
          id: participantExists.id,
        },
        data: {
          status: 'COMPLETE',
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

      const participantUpdated = await this.prisma.eventParticipant.update({
        where: {
          id: participantExists.id,
        },
        data: {
          status: 'COMPLETE',
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

  async getAllParticipantNetworks(
    userEmail: string,
  ): Promise<ParticipantSocialNetworks> {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLocaleLowerCase(),
        },
        include: {
          userSocials: true,
        },
      });

      if (!userExists) throw new NotFoundException('User not found');

      if (userExists.userSocials.length <= 0) {
        return;
      }

      const socialFormatted: ParticipantSocialNetworDto[] = [];

      for (const social of userExists.userSocials) {
        if (social.username) {
          socialFormatted.push({
            id: social.id,
            network: social.network,
            username: social.username,
          });
        }
      }

      const response: ParticipantSocialNetworks = {
        data: socialFormatted,
      };

      return response;
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
          eventTicketPrice: true,
        },
      });

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const response: ParticipantTicketDto = {
        id: participant.id,
        ticketName: participant.eventTicket.title,
        price: Number(participant.eventTicketPrice.price),
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
    initialDate?: string,
    finalDate?: string,
  ): Promise<FindAllPublicEvents> {
    try {
      const where: Prisma.EventWhereInput = {
        public: true,
        status: 'ENABLE',
      };

      if (category) {
        where.category = { contains: category, mode: 'insensitive' };
      }

      if (title) {
        where.title = { contains: title, mode: 'insensitive' };
      }

      if (initialDate || finalDate) {
        where.startAt = {
          gte: initialDate
            ? new Date(`${initialDate}T00:00:00.000Z`)
            : '1000-12-31T00:00:00.000Z',
          lte: finalDate
            ? new Date(`${finalDate}T23:59:59.999Z`)
            : '3000-12-31T23:59:59.999Z',
        };
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
          state: event.state,
          city: event.city,
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

  async findAllPublicEventsHome() {
    try {
      const categories = await this.prisma.event.findMany({
        where: {
          public: true,
          status: 'ENABLE',
        },
        select: {
          category: true,
        },
        distinct: ['category'],
      });

      const groupedEvents = await Promise.all(
        categories.map(async (category) => {
          const events = await this.prisma.event.findMany({
            where: {
              public: true,
              status: 'ENABLE',
              category: category.category,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              photo: true,
              category: true,
              startAt: true,
              state: true,
              city: true,
            },
            orderBy: {
              startAt: 'desc',
            },
            take: 10,
          });
          return {
            category: category.category,
            events,
          };
        }),
      );

      return groupedEvents;
    } catch (error) {
      throw error;
    }
  }

  async getEventsMoreView(): Promise<FindAllPublicEventsDto> {
    try {
      const where: Prisma.EventWhereInput = {
        public: true,
        status: 'ENABLE',
      };

      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          viewsCount: 'desc',
        },
        take: 4,
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
          state: event.state,
          city: event.city,
          view: event.viewsCount,
        };
      });

      const response: FindAllPublicEventsDto = eventsFormatted;

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
          status: 'ENABLE',
        },
        include: {
          eventTicket: {
            include: {
              eventTicketDays: true,
              eventTicketPrice: {
                include: {
                  EventParticipant: true,
                },
              },
            },
          },
          eventConfig: true,
          eventTerm: {
            include: {
              term: true,
            },
          },
        },
      });

      if (!event) throw new NotFoundException('Event not found or disabled');

      const ticketsPrice = [];

      if (event.eventTicket) {
        event.eventTicket.map((ticket) => {
          const ticketDays = [];

          if (ticket.eventTicketDays.length > 0) {
            ticket.eventTicketDays.map((day) => {
              ticketDays.push({
                id: day.id,
                date: day.date,
              });
            });
          }

          if (ticket.isBonus === false) {
            ticket.eventTicketPrice.map((price) => {
              if (ticket.isPrivate === false) {
                ticketsPrice.push({
                  id: price.id,
                  batch: price.batch,
                  title: ticket.title,
                  price: Number(price.price),
                  description: ticket.description,
                  avaible: price.guests - price.EventParticipant.length,
                  currency: price.currency,
                  ticketDays: ticketDays,
                });
              }
            });
          }
        });
      }

      const response: FindOnePublicEventsDto = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        photo: event.photo,
        category: event.category,
        description: event.description,
        startAt: event.startAt,
        endAt: event.endAt,
        longitude: event.longitude,
        latitude: event.latitude,
        location: event.location,
        address: event.address,
        city: event.city,
        complement: event.complement,
        country: event.country,
        number: event.number,
        state: event.state,
        district: event.district,
        ticket: ticketsPrice,
        config: {
          credentialType: event.eventConfig[0].credentialType,
          participantNetworks: event.eventConfig[0].participantNetworks,
        },
        term: {
          id: event.eventTerm[0] ? event.eventTerm[0].term.id : null,
          name: event.eventTerm[0] ? event.eventTerm[0].term.name : null,
          path: event.eventTerm[0] ? event.eventTerm[0].term.path : null,
        },
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async listTickets(
    userId: string,
    page: number,
    perPage: number,
    searchable?: string,
    initialDate?: string,
    finalDate?: string,
  ): Promise<ListTickets> {
    try {
      const where: Prisma.EventWhereInput = {
        OR: [
          {
            eventTicket: {
              some: {
                eventTicketPrice: {
                  some: {
                    EventTicketLink: {
                      some: {
                        userId,
                      },
                    },
                  },
                },
              },
            },
          },
          {
            eventParticipant: {
              some: {
                userId,
              },
            },
          },
        ],
      };

      if (searchable) {
        where.fullySearch = { contains: searchable, mode: 'insensitive' };
      }

      if (initialDate || finalDate) {
        where.startAt = {
          gte: initialDate
            ? new Date(`${initialDate}T00:00:00.000Z`)
            : '1000-12-31T00:00:00.000Z',
          lte: finalDate
            ? new Date(`${finalDate}T23:59:59.999Z`)
            : '3000-12-31T23:59:59.999Z',
        };
      }

      const events = await this.prisma.event.findMany({
        where,
        take: Number(perPage),
        skip: (page - 1) * Number(perPage),
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalItems = await this.prisma.event.count({ where });

      const pagination = await this.paginationService.paginate({
        page,
        perPage: perPage,
        totalItems,
      });

      const eventsFormatted: ListTicketsDto = events.map((event) => {
        return {
          id: event.id,
          eventTitle: event.title,
          eventPhoto: event.photo,
          eventStartAt: event.startAt,
          eventSlug: event.slug,
          eventLatitude: event.latitude,
          eventLocation: event.location,
          eventLongitude: event.longitude,
          state: event.state,
          city: event.city,
          address: event.address,
          complement: event.complement,
          country: event.country,
          number: event.number,
          district: event.district,
        };
      });

      const response: ListTickets = {
        data: eventsFormatted,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async eventTicketInfo(
    userId: string,
    eventSlug: string,
  ): Promise<EventTicketInfoDto> {
    try {
      const event = await this.prisma.event.findUnique({
        where: {
          slug: eventSlug,
        },
      });

      if (!event) throw new NotFoundException('Event not found');

      let avaibleGuests = 0;

      const guests = [];
      const links = [];

      const eventParticipant = await this.prisma.eventParticipant.findFirst({
        where: {
          userId,
          eventId: event.id,
        },
        include: {
          event: true,
          eventTicket: true,
          user: true,
        },
      });

      const ticket = await this.prisma.eventTicket.findUnique({
        where: {
          id: eventParticipant.eventTicketId,
        },
        include: {
          EventTicketBonus: true,
        },
      });
      await Promise.all(
        ticket.EventTicketBonus.map(async (b) => {
          const bonus = await this.prisma.eventTicket.findFirst({
            where: {
              title: b.eventTicketBonusTitle,
              isBonus: true,
            },
          });

          const link = await this.prisma.eventTicketLink.findFirst({
            where: {
              eventTicketId: bonus.id,
              userId: userId,
            },
            include: {
              eventTicket: true,
              eventParticipant: {
                include: {
                  user: true,
                  eventTicket: true,
                },
              },
            },
          });

          link.eventParticipant.map((part) => {
            guests.push({
              participantId: part.id,
              name: part.user.name,
              ticketName: part.eventTicket.title,
              document: part.user.document,
            });
          });

          avaibleGuests += link.invite - link.eventParticipant.length;

          links.push({
            id: link.id,
            ticketId: link.eventTicketId,
            ticketName: link.eventTicket.title,
            guests: link.eventParticipant.length,
            limit: link.invite,
          });
        }),
      );

      const response: EventTicketInfoDto = {
        eventPhoto: event.photo,
        eventTitle: event.title,
        eventDescription: event.description,
        eventState: event.state,
        eventCity: event.city,
        eventAddress: event.address,
        eventNumber: event.number,
        eventDistrict: event.district,
        eventComplement: event.complement,
        eventLatitude: event.latitude,
        eventLongitude: event.longitude,
        eventStartAt: event.startAt,
        eventEndAt: event.endAt,

        eventParticipantId: eventParticipant ? eventParticipant.id : null,
        eventParticipantName: eventParticipant
          ? eventParticipant.user.name
          : null,
        eventParticipantDocument: eventParticipant
          ? eventParticipant.user.document
          : null,
        eventParticipantQrcode: eventParticipant
          ? eventParticipant.qrcode
          : null,
        eventTicketTitle: eventParticipant
          ? eventParticipant.eventTicket.title
          : null,

        avaibleGuests: avaibleGuests,

        links: links,

        guests: guests,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTicketInfoByLink(
    eventTicketId: string,
  ): Promise<FindTicketByLinkResponseDto> {
    try {
      const link = await this.prisma.eventTicketLink.findUnique({
        where: {
          id: eventTicketId,
        },
      });

      if (!link) throw new NotFoundException('Link not found');

      const ticket = await this.prisma.eventTicket.findUnique({
        where: {
          id: link.eventTicketId,
        },
        include: {
          eventTicketDays: true,
          event: true,
        },
      });

      if (!ticket) throw new NotFoundException('ticket not found');

      const days = [];

      if (ticket.eventTicketDays.length > 0) {
        ticket.eventTicketDays.forEach((day) => {
          days.push({
            id: day.id,
            date: day.date,
          });
        });
      } else {
        const newStartAt = new Date(ticket.event.startAt);
        const newEndAt = new Date(ticket.event.endAt);
        let currentDate = newStartAt;

        while (currentDate <= newEndAt) {
          days.push({
            date: new Date(currentDate),
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      const response: FindTicketByLinkResponseDto = {
        id: ticket.id,
        ticketName: ticket.title,
        description: ticket.description,
        ticketDays: days,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async eventTicketSell(
    userId: string,
    body: EventTicketSellDto,
    updateUser: boolean,
  ) {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExist) throw new NotFoundException('User not found');

      const { eventSlug, eventTickets, networks, user } = body;
      const { name, phone, city, state, document } = user;

      if (updateUser) {
        await this.prisma.user.update({
          where: { id: userExist.id },
          data: {
            name: name,
            phoneNumber: phone,
            document: document,
            city: city,
            state: state,
          },
        });
      }

      const event = await this.prisma.event.findUnique({
        where: {
          slug: eventSlug,
        },
        include: {
          eventTerm: {
            include: {
              term: true,
            },
          },
        },
      });

      if (!event) throw new NotFoundException('Event not found');

      if (event.status === 'DISABLE')
        throw new ConflictException('Event is disabled');

      if (
        event.eventTerm.length > 0 &&
        event.eventTerm[0].signature &&
        userExist.validAt === null
      ) {
        throw new ConflictException(
          'O evento requer que o participante seja verificado',
        );
      }

      let partId = null;
      const links = [];
      const lineItems = [];
      let onlyReal = true;

      await Promise.all(
        eventTickets.map(async (ticket) => {
          const ticketPriceExist =
            await this.prisma.eventTicketPrice.findUnique({
              where: {
                id: ticket.ticketPriceId,
              },
              include: {
                eventTicket: {
                  include: {
                    event: true,
                    EventTicketBonus: true,
                  },
                },
                EventParticipant: true,
              },
            });

          if (!ticketPriceExist)
            throw new NotFoundException('Ticket not found');

          const limitBatch =
            ticketPriceExist.guests - ticketPriceExist.EventParticipant.length;

          if (limitBatch <= ticket.ticketQuantity) {
            throw new ConflictException(
              `O limite de ingressos para o lote ${ticketPriceExist.batch} do ingresso ${ticketPriceExist.eventTicket.title} foi atingido`,
            );
          }

          if (
            Number(ticketPriceExist.price) > 0 &&
            ticketPriceExist.stripePriceId
          ) {
            lineItems.push({
              price: ticketPriceExist.stripePriceId,
              quantity: ticket.ticketQuantity,
            });

            if (
              ticketPriceExist.currency === 'USD' ||
              ticketPriceExist.currency === 'EUR'
            ) {
              onlyReal = false;
            }
          }
          if (ticket.participant === user.email) {
            const participantExists =
              await this.prisma.eventParticipant.findFirst({
                where: {
                  userId,
                  eventTicketId: ticketPriceExist.eventTicketId,
                  eventTicketPriceId: ticketPriceExist.id,
                  eventId: ticketPriceExist.eventTicket.eventId,
                },
              });

            if (!participantExists) {
              const qrcode = randomUUID();
              const fully = concatTitleAndCategoryEvent(
                event.title,
                ticketPriceExist.eventTicket.title,
              );

              const sequential = await this.prisma.eventParticipant.count({
                where: {
                  eventId: ticketPriceExist.eventTicket.eventId,
                },
              });

              const part = await this.prisma.eventParticipant.create({
                data: {
                  userId,
                  eventTicketId: ticketPriceExist.eventTicketId,
                  eventTicketPriceId: ticketPriceExist.id,
                  eventId: ticketPriceExist.eventTicket.eventId,
                  qrcode,
                  sequential: sequential + 1,
                  status: 'AWAITING_PAYMENT',
                  fullySearch: fully,
                  signature: true,
                },
              });

              partId = part.id;

              await this.createParticipantNetworks(part.id, networks);

              await Promise.all(
                ticketPriceExist.eventTicket.EventTicketBonus.map(
                  async (bonus) => {
                    const ticketBonus = await this.prisma.eventTicket.findFirst(
                      {
                        where: {
                          eventId: event.id,
                          title: bonus.eventTicketBonusTitle,
                        },
                      },
                    );

                    if (!ticketBonus)
                      throw new NotFoundException('Ticket bonus not found');

                    const linkCreated =
                      await this.prisma.eventTicketLink.create({
                        data: {
                          invite: bonus.qtd,
                          eventTicketId: ticketBonus.id,
                          eventTicketPriceId: ticketPriceExist.id,
                          userId: userExist.id,
                        },
                      });

                    links.push(linkCreated);
                  },
                ),
              );
            }
          } else {
            const linkCreated = await this.prisma.eventTicketLink.create({
              data: {
                invite: ticket.ticketQuantity,
                eventTicketId: ticketPriceExist.eventTicketId,
                eventTicketPriceId: ticketPriceExist.id,
                userId: userExist.id,
              },
            });

            await Promise.all(
              ticketPriceExist.eventTicket.EventTicketBonus.map(
                async (bonus) => {
                  const ticketBonus = await this.prisma.eventTicket.findFirst({
                    where: {
                      eventId: event.id,
                      title: bonus.eventTicketBonusTitle,
                    },
                  });

                  if (!ticketBonus)
                    throw new NotFoundException('Ticket bonus not found');

                  const linkCreated = await this.prisma.eventTicketLink.create({
                    data: {
                      invite: bonus.qtd,
                      eventTicketId: ticketBonus.id,
                      eventTicketPriceId: ticketPriceExist.id,
                      userId: userExist.id,
                    },
                  });

                  links.push(linkCreated);
                },
              ),
            );

            links.push(linkCreated);
          }
        }),
      );

      let sessionId = null;
      let sessionUrl = null;
      if (lineItems.length > 0) {
        const created = await this.stripe.checkoutSessionEventParticipant(
          lineItems,
          onlyReal,
          partId ? partId : null,
        );

        sessionId = created.id;
        sessionUrl = created.url;
      }

      await Promise.all(
        eventTickets.map(async (ticket) => {
          const ticketId = await this.prisma.eventTicketPrice.findUnique({
            where: {
              id: ticket.ticketPriceId,
            },
          });

          const total = Number(ticketId.price) * ticket.ticketQuantity;

          await this.prisma.userTicket.create({
            data: {
              userId: userId,
              eventId: event.id,
              eventTicketId: ticketId.eventTicketId,
              eventTicketPriceId: ticketId.id,
              qtd: ticket.ticketQuantity,
            },
          });

          await this.prisma.balanceHistoric.create({
            data: {
              userId: userId,
              paymentId: sessionId ? sessionId : null,
              value: total.toFixed(2),
              eventId: event.id,
              eventTicketId: ticketId.eventTicketId,
              status:
                sessionId || Number(ticketId.price) > 0
                  ? 'PENDING'
                  : 'RECEIVED',
            },
          });
        }),
      );

      return {
        sessionId: sessionId,
        participantId: partId,
        sessionUrl: sessionUrl,
      };
    } catch (error) {
      throw error;
    }
  }

  async eventAddViewCount(eventSlug: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: {
          slug: eventSlug,
          status: 'ENABLE',
        },
      });

      if (!event) throw new NotFoundException('Event not found or disabled');

      await this.prisma.event.update({
        where: {
          id: event.id,
        },
        data: {
          viewsCount: event.viewsCount + 1,
        },
      });

      return;
    } catch (error) {
      throw error;
    }
  }

  async networkParticipant(qrcode: string): Promise<NetworkParticipantDto> {
    try {
      const participant = await this.prisma.eventParticipant.findFirst({
        where: {
          qrcode: qrcode,
        },
        include: {
          user: {
            include: {
              userHobbie: true,
              userSocials: true,
            },
          },
        },
      });

      const response: NetworkParticipantDto = {
        name: participant.user.name,
        profilePhoto: participant.user.profilePhoto,

        userNetwork: participant.user.userSocials.map((social) => {
          return {
            id: social.id,
            network: social.network,
            username: social.username,
          };
        }),

        userHobbie: participant.user.userHobbie.map((hobbie) => {
          return {
            id: hobbie.id,
            description: hobbie.description,
            rating: hobbie.rating,
          };
        }),
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async createNetwork(userEmail: string, qrcode: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLowerCase(),
        },
      });

      if (!user) throw new NotFoundException('User not found');

      const participant = await this.prisma.eventParticipant.findFirst({
        where: {
          qrcode: qrcode,
        },
      });

      if (!participant) throw new NotFoundException('Participant not found');

      if (user.id === participant.userId)
        throw new ConflictException('User is the participant');

      const networkExistis =
        await this.prisma.userEventNetworkHistoric.findFirst({
          where: {
            userId: user.id,
            eventParticipantId: participant.id,
          },
        });

      if (networkExistis) throw new ConflictException('Network already exists');

      await this.prisma.userEventNetworkHistoric.create({
        data: {
          userId: user.id,
          eventParticipantId: participant.id,
        },
      });

      return 'success';
    } catch (error) {
      throw error;
    }
  }

  async networkHistoric(
    userEmail: string,
    page: number,
    perPage: number,
  ): Promise<NetworkHistoric> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLowerCase(),
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const historic = await this.prisma.userEventNetworkHistoric.findMany({
        where: {
          userId: user.id,
        },
        take: Number(perPage),
        skip: (page - 1) * Number(perPage),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          eventParticipant: {
            include: {
              user: true,
              event: true,
            },
          },
        },
      });

      const totalItems = await this.prisma.userEventNetworkHistoric.count({
        where: { userId: user.id },
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage: perPage,
        totalItems,
      });

      const data: NetworkHistoricDto[] = [];

      historic.map((historic) => {
        data.push({
          id: historic.id,
          name: historic.eventParticipant.user.name,
          eventName: historic.eventParticipant.event.title,
          profilePhoto: historic.eventParticipant.user.profilePhoto,
        });
      });

      const response: NetworkHistoric = {
        data: data,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email: string): Promise<FindByEmailDto | null> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
        include: {
          userFacials: true,
        },
      });

      if (!userExist) {
        return null;
      }

      let facial = null;

      await Promise.all(
        userExist.userFacials.map((face) => {
          const today = new Date();
          if (face.expirationDate > today && facial == null) {
            facial = face.path;
          }
        }),
      );

      const response: FindByEmailDto = {
        city: userExist.city,
        email: userExist.email,
        id: userExist.id,
        name: userExist.name,
        phoneNumber: userExist.phoneNumber,
        phoneCountry: userExist.phoneCountry,
        validAt: userExist.validAt,
        state: userExist.state,
        country: userExist.country,
        document: userExist.document,
        userFace: facial,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async thanksScreen(partId: string): Promise<ThanksScreenDto> {
    try {
      const part = await this.prisma.eventParticipant.findUnique({
        where: {
          id: partId,
        },
        include: {
          event: true,
          eventTicket: true,
          user: true,
        },
      });

      const response: ThanksScreenDto = {
        evenState: part.event.state,
        eventSlug: part.event.slug,
        eventCity: part.event.city,
        eventPhoto: part.event.photo,
        eventEndAt: part.event.endAt,
        eventParticipantName: part.user.name,
        eventParticipantQrcode: part.qrcode,
        eventParticipantTicketTitle: part.eventTicket.title,
        eventStartAt: part.event.startAt,
        eventTitle: part.event.title,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getQuiz(quizId: string): Promise<QuizDto> {
    try {
      const quizExist = await this.prisma.eventQuiz.findUnique({
        where: {
          id: quizId,
        },
        include: {
          EventQuizQuestion: {
            include: {
              EventQuizQuestionOption: true,
            },
          },
        },
      });

      console.log('test');

      if (!quizExist) {
        throw new NotFoundException('Quiz not found');
      }

      const eventExist = await this.prisma.event.findUnique({
        where: {
          id: quizExist.eventId,
        },
      });

      if (!eventExist) {
        throw new NotFoundException('Event not found');
      }

      const questions: QuizQuestionDto[] = [];

      await Promise.all(
        quizExist.EventQuizQuestion.map((question) => {
          const options = [];

          if (question.EventQuizQuestionOption.length > 0) {
            question.EventQuizQuestionOption.map((option) => {
              options.push({
                optionId: option.id,
                sequential: option.sequential,
                description: option.description,
                isOther: option.isOther,
              });
            });
          }

          questions.push({
            questionId: question.id,
            description: question.description,
            isMandatory: question.isMandatory,
            multipleChoice: question.multipleChoice,
            questionType: question.questionType,
            sequential: question.sequential,
            options: options.length > 0 ? options : null,
          });
        }),
      );

      const response: QuizDto = {
        quizId: quizExist.id,
        title: quizExist.title,
        startAt: quizExist.startAt,
        endAt: quizExist.endAt,
        status: quizExist.status,
        anonimousResponse: quizExist.anonimousResponse,
        questions: questions,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async createQuizResponses(
    quizId: string,
    userEmail: string,
    body: CreateParticipantQuizDto,
  ): Promise<QuizCreateResponseDto> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLowerCase(),
        },
      });

      if (!userExist) {
        throw new NotFoundException('User not found');
      }

      const quizExist = await this.prisma.eventQuiz.findUnique({
        where: {
          id: quizId,
        },
        include: {
          EventQuizQuestion: {
            include: {
              EventQuizQuestionOption: true,
            },
          },
        },
      });

      if (!quizExist) {
        throw new NotFoundException('Quiz not found');
      }

      const eventExist = await this.prisma.event.findUnique({
        where: {
          id: quizExist.eventId,
        },
      });

      if (!eventExist) {
        throw new NotFoundException('Event not found');
      }

      const participant = await this.prisma.eventParticipant.findFirst({
        where: {
          userId: userExist.id,
          eventId: eventExist.id,
        },
      });

      if (!participant) {
        throw new NotFoundException('User not participate in this event');
      }

      const { isAnonimous, responses } = body;
      const responsesFormatted = [];

      // Usando Promise.all para aguardar todas as operações assíncronas dentro do map
      await Promise.all(
        responses.map(async (response) => {
          const question = await this.prisma.eventQuizQuestion.findUnique({
            where: {
              id: response.eventQuizQuestionId,
            },
          });

          if (!question) {
            throw new NotFoundException('Question not found');
          }

          const alreadyResponse =
            await this.prisma.eventQuizParticipantResponse.findFirst({
              where: {
                eventQuizParticipantId: participant.id,
                eventQuizQuestionId: question.id,
              },
            });

          if (alreadyResponse && !question.multipleChoice) {
            throw new BadRequestException(
              `You already answered '${question.description}' this question`,
            );
          }

          if (question.questionType === 'MULTIPLE_CHOICE') {
            if (!response.eventQuizQuestionOptionId) {
              throw new BadRequestException(
                'You must select an option for a multiple choice question',
              );
            }

            const optionExist =
              await this.prisma.eventQuizQuestionOption.findUnique({
                where: {
                  id: response.eventQuizQuestionOptionId,
                },
              });

            if (!optionExist) {
              throw new NotFoundException('Option not found');
            }

            if (optionExist.isOther && !response.response) {
              throw new BadRequestException(
                'You must fill the other field for other option question',
              );
            }

            responsesFormatted.push({
              eventQuizQuestionId: response.eventQuizQuestionId,
              eventQuizQuestionOptionId: response.eventQuizQuestionOptionId,
              response: optionExist.isOther ? response.response : null,
            });
          } else if (question.questionType === 'RATING') {
            responsesFormatted.push({
              eventQuizQuestionId: response.eventQuizQuestionId,
              rating: response.rating,
            });
          } else {
            responsesFormatted.push({
              eventQuizQuestionId: response.eventQuizQuestionId,
              response: response.response,
            });
          }
        }),
      );

      await this.prisma.eventQuizParticipant.create({
        data: {
          eventParticipantId: participant.id,
          eventQuizId: quizExist.id,
          userId: participant.userId,
          isAnonimous,
          EventQuizParticipantResponse: {
            createMany: {
              data: responsesFormatted,
            },
          },
        },
      });

      return {
        ok: 'Quiz responses created successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async userIsParticipantInEventByQuizId(
    quizId: string,
    userEmail: string,
  ): Promise<Boolean> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLowerCase(),
        },
      });

      if (!userExist) {
        throw new NotFoundException('User not found');
      }

      const quizExist = await this.prisma.eventQuiz.findUnique({
        where: {
          id: quizId,
        },
        include: {
          EventQuizQuestion: {
            include: {
              EventQuizQuestionOption: true,
            },
          },
        },
      });

      if (!quizExist) {
        throw new NotFoundException('Quiz not found');
      }

      const eventExist = await this.prisma.event.findUnique({
        where: {
          id: quizExist.eventId,
        },
      });

      if (!eventExist) {
        throw new NotFoundException('Event not found');
      }

      const participant = await this.prisma.eventParticipant.findFirst({
        where: {
          userId: userExist.id,
          eventId: eventExist.id,
        },
      });

      if (!participant) {
        throw new NotFoundException('User not participate in this event');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  async userIsParticipantInEventByLinkId(
    linkId: string,
    userEmail: string,
  ): Promise<UserIsParticipantInEventByLinkIdResponseDto> {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLowerCase(),
        },
      });

      let userFacials = null;
      let participant = null;

      if (userExist) {
        const link = await this.prisma.eventTicketLink.findUnique({
          where: {
            id: linkId,
          },
          include: {
            eventTicket: true,
          },
        });

        if (!link) {
          throw new NotFoundException('Event ticket link not found');
        }

        const eventExist = await this.prisma.event.findUnique({
          where: {
            id: link.eventTicket.eventId,
          },
        });

        if (!eventExist) {
          throw new NotFoundException('Event not found');
        }

        participant = await this.prisma.eventParticipant.findFirst({
          where: {
            userId: userExist.id,
            eventId: eventExist.id,
          },
        });

        userFacials = await this.prisma.userFacial.findMany({
          where: {
            userId: userExist.id,
            expirationDate: {
              lte: new Date(),
            },
          },
        });
      }

      return {
        isParticipant: participant ? true : false,
        haveFacial: userFacials ? true : false,
        participantId: participant ? participant.id : null,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkTicketIsAvaible(
    eventSlug: string,
    linkId: string,
  ): Promise<boolean> {
    try {
      const event = await this.prisma.event.findUnique({
        where: {
          slug: eventSlug,
          status: 'ENABLE',
        },
      });

      if (!event) throw new NotFoundException('Event not found or disable');

      const ticketExists = await this.prisma.eventTicketLink.findUnique({
        where: {
          id: linkId,
          eventTicket: {
            eventId: event.id,
          },
          status: { not: 'FULL' },
        },
      });

      return ticketExists ? true : false;
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
        user.email.toLowerCase(),
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
}
