import { Module } from '@nestjs/common';
import { SponsorUserController } from './sponsor-user.controller';
import { SponsorUserService } from './sponsor-user.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [SponsorUserController],
  providers: [SponsorUserService, PrismaService],
})
export class SponsorUserModule {}
