import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { CreateSponsorUserDto } from './dto/create-sponser-user.dto';
import { ResponseSponsorUserDto } from './dto/response-sponser-user.dto';
import { ResponseSponsorUserSchema } from './schemas/response-sponsor-user.schema';
import { UpdateSponsorUserDto } from './dto/update-sponser-user.dto';

@Injectable()
export class SponsorUserService {
  constructor(private readonly prisma: PrismaService) {}

  async createSponsor(
    userId: string,
    body: CreateSponsorUserDto,
  ): Promise<ResponseSponsorUserDto> {
    try {
      const sponsorAlreadyExists = await this.findSponsorUser(userId);

      if (sponsorAlreadyExists)
        throw new ConflictException('Sponsor user already exists');

      const { publicKey, secretKey } = body;

      const sponsorUser = await this.prisma.sponsorUser.create({
        data: {
          userId,
          publicKey,
          secretKey,
        },
      });

      const response: ResponseSponsorUserDto = {
        id: sponsorUser.id,
        userId: sponsorUser.userId,
        publicKey: sponsorUser.publicKey,
        secretKey: sponsorUser.secretKey,
      };

      await ResponseSponsorUserSchema.parseAsync(response);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findSponsorUser(
    userId: string,
  ): Promise<ResponseSponsorUserDto | null> {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExists) throw new NotFoundException('User not found');

      const sponsorAlreadyExists = await this.prisma.sponsorUser.findFirst({
        where: {
          userId: userId,
        },
      });

      if (sponsorAlreadyExists) {
        const response: ResponseSponsorUserDto = {
          id: sponsorAlreadyExists.id,
          userId: sponsorAlreadyExists.userId,
          publicKey: sponsorAlreadyExists.publicKey,
          secretKey: sponsorAlreadyExists.secretKey,
        };

        await ResponseSponsorUserSchema.parseAsync(response);

        return response;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async update(
    userId: string,
    body: UpdateSponsorUserDto,
  ): Promise<ResponseSponsorUserDto> {
    try {
      const sponsorAlreadyExists = await this.findSponsorUser(userId);

      if (!sponsorAlreadyExists)
        throw new NotFoundException('Sponser user not found');

      const { publicKey, secretKey } = body;

      const sponsorUser = await this.prisma.sponsorUser.update({
        where: {
          userId: userId,
          id: sponsorAlreadyExists.id,
        },
        data: {
          publicKey: publicKey ? publicKey : sponsorAlreadyExists.publicKey,
          secretKey: secretKey ? secretKey : sponsorAlreadyExists.secretKey,
        },
      });

      const response: ResponseSponsorUserDto = {
        id: sponsorUser.id,
        userId: sponsorUser.userId,
        publicKey: sponsorUser.publicKey,
        secretKey: sponsorUser.secretKey,
      };

      await ResponseSponsorUserSchema.parseAsync(response);

      return response;
    } catch (error) {
      throw error;
    }
  }
}
