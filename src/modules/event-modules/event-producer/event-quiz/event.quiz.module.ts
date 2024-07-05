import { Module } from '@nestjs/common';
import { EventQuizController } from './event-quiz.controller';
import { PrismaService } from 'src/services/prisma.service';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import { PaginationService } from 'src/services/paginate.service';
import { EventQuizService } from './event-quiz.service';

@Module({
  providers: [
    PrismaService,
    UserProducerValidationService,
    PaginationService,
    EventQuizService,
  ],
  controllers: [EventQuizController],
})
export class EventQuizModule {}
