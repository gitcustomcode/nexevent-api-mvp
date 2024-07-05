import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { EventQuizCreateDto } from './dto/event.quiz.dto';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';

@Injectable()
export class EventQuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
  ) {}

  async createQuiz(userEmail: string, slug: string, body: EventQuizCreateDto) {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          email: userEmail.toLowerCase(),
        },
      });

      const { title, status, startAt, endAt, anonimousResponse, questions } =
        body;

      const quiz = await this.prisma.eventQuiz.create({
        data: {
          eventId: event.id,
          userId: user.id,
          title,
          status,
          startAt,
          endAt,
          anonimousResponse,
        },
      });

      questions.forEach(async (question) => {
        const options = [];
        if (question.questionType === 'MULTIPLE_CHOICE') {
          if (question.questionOptions.length < 2) {
            await this.prisma.eventQuiz.delete({
              where: {
                id: quiz.id,
              },
            });

            throw new ConflictException(
              `Perguntas objetivas precisam pelo menos de 2 opções de resposta`,
            );
          }

          question.questionOptions.map((option) => {
            options.push({
              sequential: option.sequential,
              description: option.description,
              isOther: option.isOther,
            });
          });

          await this.prisma.eventQuizQuestion.create({
            data: {
              eventQuizId: quiz.id,
              description: question.description,
              questionType: question.questionType,
              sequential: question.sequential,
              multipleChoice: question.multipleChoice,
              isMandatory: question.isMandatory,
              EventQuizQuestionOption: {
                createMany: {
                  data: options,
                },
              },
            },
          });
        }

        await this.prisma.eventQuizQuestion.create({
          data: {
            eventQuizId: quiz.id,
            description: question.description,
            questionType: question.questionType,
            sequential: question.sequential,
            isMandatory: question.isMandatory,
          },
        });
      });

      return 'Quiz created successfully';
    } catch (error) {
      throw error;
    }
  }

  async findAllQuizzes(userEmail: string, slug: string, quizId: string) {}
}
