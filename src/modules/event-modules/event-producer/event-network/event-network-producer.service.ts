import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaginationService } from 'src/services/paginate.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { EventNetworksProducerCreateDto } from './dto/event-networks-producer-create.dto';
import { EventNetworksResponse } from './dto/event-networks-producer-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventNetworksProducerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly paginationService: PaginationService,
  ) {}

  async createEventNetworks(
    userEmail: string,
    slug: string,
    body: EventNetworksProducerCreateDto,
  ): Promise<String> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail,
      );

      const eventNetworksFormatted = body.map((network) => {
        return {
          eventId: event.id,
          network: network.network,
          uri: network.uri,
          description: network.description,
        };
      });

      await this.prisma.eventNetwork.deleteMany({
        where: {
          eventId: event.id,
        },
      });

      await this.prisma.eventNetwork.createMany({
        data: eventNetworksFormatted,
      });

      return 'Networks created successfully';
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

  async findAllEventNetworks(
    userEmail: string,
    slug: string,
    page: number,
    perPage: number,
  ): Promise<EventNetworksResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail,
      );
      const where: Prisma.EventNetworkWhereInput = {
        eventId: event.id,
      };

      const networks = await this.prisma.eventNetwork.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      });

      const totalItems = await this.prisma.eventNetwork.count({
        where,
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const response: EventNetworksResponse = {
        data: networks.map((network) => {
          return {
            id: network.id,
            network: network.network,
            uri: network.uri,
            description: network.description,
          };
        }),
        pageInfo: pagination,
      };

      return response;
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
}
