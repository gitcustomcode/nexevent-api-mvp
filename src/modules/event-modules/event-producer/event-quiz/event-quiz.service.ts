import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import {
  EventQuizCreateDto,
  EventQuizQuestionCreateDto,
} from './dto/event-quiz-create.dto';
import { UserProducerValidationService } from 'src/services/user-producer-validation.service';
import {
  EventParticipantQuestionResponseDto,
  EventParticipantResponseDto,
  EventQuizCreatedResponseDto,
  EventQuizDashboarDto,
  EventQuizFindAllResponse,
  EventQuizFindAllResponseDto,
  EventQuizParticipantsResponse,
  EventQuizParticipantsResponseDto,
} from './dto/event-quiz-response.dto';
import { PaginationService } from 'src/services/paginate.service';

@Injectable()
export class EventQuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProducerValidationService: UserProducerValidationService,
    private readonly paginationService: PaginationService,
  ) {}

  async createQuiz(
    userEmail: string,
    slug: string,
    body: EventQuizCreateDto,
  ): Promise<EventQuizCreatedResponseDto> {
    try {
      console.log(body);
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

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { title, status, startAt, endAt, anonimousResponse, questions } =
        body;

      if (questions.length <= 0) {
        throw new BadRequestException('The quiz does not have questions');
      }

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

      const questionPromises = questions.map(async (question) => {
        if (question.questionType === 'MULTIPLE_CHOICE') {
          if (question.questionOptions.length < 2) {
            await this.prisma.eventQuiz.delete({
              where: {
                id: quiz.id,
              },
            });

            throw new ConflictException(
              'Multiple choice questions need at least 2 options',
            );
          }

          const questionCreated = await this.prisma.eventQuizQuestion.create({
            data: {
              eventQuizId: quiz.id,
              description: question.description,
              questionType: question.questionType,
              sequential: question.sequential,
              multipleChoice: question.multipleChoice,
              isMandatory: question.isMandatory,
            },
          });

          const options = question.questionOptions.map((option) => ({
            description: option.description,
            sequential: option.sequential,
            eventQuizQuestionId: questionCreated.id,
            isOther: option.isOther,
          }));

          await this.prisma.eventQuizQuestionOption.createMany({
            data: options,
          });
        } else {
          await this.prisma.eventQuizQuestion.create({
            data: {
              eventQuizId: quiz.id,
              description: question.description,
              questionType: question.questionType,
              sequential: question.sequential,
              isMandatory: question.isMandatory,
            },
          });
        }
      });

      await Promise.all(questionPromises);

      return {
        ok: 'Quiz created successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async findAllQuizzes(
    userEmail: string,
    slug: string,
    page: number,
    perPage: number,
  ): Promise<EventQuizFindAllResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const quiz = await this.prisma.eventQuiz.findMany({
        where: {
          eventId: event.id,
          deletedAt: null,
        },
        include: {
          EventQuizParticipant: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      });

      const totalItems = await this.prisma.eventQuiz.count({
        where: {
          eventId: event.id,
          deletedAt: null,
        },
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const quizFormatted: EventQuizFindAllResponseDto = [];

      quiz.map((q) => {
        quizFormatted.push({
          id: q.id,
          endAt: q.endAt,
          responses: q.EventQuizParticipant.length,
          startAt: q.startAt,
          status: q.status,
          title: q.title,
        });
      });

      const response: EventQuizFindAllResponse = {
        data: quizFormatted,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async quizDashboard(
    userEmail: string,
    slug: string,
    quizId: string,
  ): Promise<EventQuizDashboarDto> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const quiz = await this.prisma.eventQuiz.findUnique({
        where: {
          eventId: event.id,
          deletedAt: null,
          id: quizId,
        },
        include: {
          EventQuizParticipant: true,
          EventQuizQuestion: {
            include: {
              EventQuizQuestionOption: {
                include: {
                  EventQuizParticipantResponse: true,
                },
              },
              EventQuizParticipantResponse: {
                include: {
                  eventQuizParticipant: true,
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Event quiz not found');
      }

      const multipleChoice = [];
      const rating = [];

      quiz.EventQuizQuestion.forEach(async (question) => {
        if (question.questionType === 'MULTIPLE_CHOICE') {
          multipleChoice.push({
            questionId: question.id,
            totalResponses: question.EventQuizParticipantResponse.length,
            options: question.EventQuizQuestionOption.map((option) => {
              return {
                optionId: option.id,
                optionTitle: option.description,
                totalResponses: option.EventQuizParticipantResponse.length,
              };
            }),
          });
        } else if (question.questionType === 'RATING') {
          const ratingTotals = new Map<number, number>();

          question.EventQuizParticipantResponse.map((response) => {
            const rating = response.rating;
            if (ratingTotals.has(rating)) {
              ratingTotals.set(rating, ratingTotals.get(rating)! + 1);
            } else {
              ratingTotals.set(rating, 1);
            }
          });

          const ratings = Array.from(ratingTotals, ([rating, total]) => {
            return {
              rating: rating,
              ratingResponseTotal: total,
            };
          });

          rating.push({
            questionId: question.id,
            totalResponses: question.EventQuizParticipantResponse.length,

            ratings: ratings,
          });
        }
      });

      const response: EventQuizDashboarDto = {
        id: quiz.id,
        title: quiz.title,
        multipleChoice,
        rating,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async quizParticipantsResponse(
    userEmail: string,
    slug: string,
    quizId: string,
    page: number,
    perPage: number,
  ): Promise<EventQuizParticipantsResponse> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const quiz = await this.prisma.eventQuizParticipant.findMany({
        where: {
          eventQuizId: quizId,
        },
        include: {
          user: true,
          EventQuizParticipantResponse: true,
          eventQuiz: {
            include: {
              EventQuizQuestion: true,
            },
          },
        },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      });

      if (!quiz) {
        throw new NotFoundException('Event quiz not found');
      }

      const totalItems = await this.prisma.eventQuizParticipant.count({
        where: {
          eventQuizId: quizId,
        },
      });

      const pagination = await this.paginationService.paginate({
        page,
        perPage,
        totalItems,
      });

      const quizFormatted: EventQuizParticipantsResponseDto = [];

      quiz.forEach((p) => {
        const uniqueResponses = [];
        const seenQuestionIds = new Set();

        p.EventQuizParticipantResponse.forEach((response) => {
          if (!seenQuestionIds.has(response.eventQuizQuestionId)) {
            uniqueResponses.push(response);
            seenQuestionIds.add(response.eventQuizQuestionId);
          }
        });

        quizFormatted.push({
          id: p.id,
          name: p.user.name,
          responses: `${uniqueResponses.length}/${p.eventQuiz.EventQuizQuestion.length}`,
        });
      });

      const response: EventQuizParticipantsResponse = {
        data: quizFormatted,
        pageInfo: pagination,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async quizParticipantResponse(
    userEmail: string,
    slug: string,
    eventQuizParticipantId: string,
    eventQuizId: string,
  ): Promise<EventParticipantResponseDto> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const eventQuizParticipant =
        await this.prisma.eventQuizParticipant.findUnique({
          where: {
            id: eventQuizParticipantId,
            eventQuizId: eventQuizId,
          },
          include: {
            user: true,
            eventQuiz: true,
            EventQuizParticipantResponse: {
              include: {
                eventQuizQuestion: true,
              },
            },
          },
        });

      const questionsResponsesMap = new Map<
        string,
        EventParticipantQuestionResponseDto
      >();

      await Promise.all(
        eventQuizParticipant.EventQuizParticipantResponse.map(
          async (response) => {
            switch (response.eventQuizQuestion.questionType) {
              case 'DESCRIPTIVE':
                questionsResponsesMap.set(response.eventQuizQuestionId, {
                  responseId: response.id,
                  eventQuizQuestionId: response.eventQuizQuestionId,
                  questionDescription: response.eventQuizQuestion.description,
                  sequential: response.eventQuizQuestion.sequential,
                  questionType: response.eventQuizQuestion.questionType,
                  isMandatory: response.eventQuizQuestion.isMandatory,
                  multipleChoice: response.eventQuizQuestion.multipleChoice,
                  response: response.response,
                });
                break;

              case 'RATING':
                questionsResponsesMap.set(response.eventQuizQuestionId, {
                  responseId: response.id,
                  eventQuizQuestionId: response.eventQuizQuestionId,
                  questionDescription: response.eventQuizQuestion.description,
                  sequential: response.eventQuizQuestion.sequential,
                  questionType: response.eventQuizQuestion.questionType,
                  isMandatory: response.eventQuizQuestion.isMandatory,
                  multipleChoice: response.eventQuizQuestion.multipleChoice,
                  rating: response.rating,
                });
                break;

              case 'MULTIPLE_CHOICE':
                const questionOptions =
                  await this.prisma.eventQuizQuestionOption.findMany({
                    where: {
                      eventQuizQuestionId: response.eventQuizQuestionId,
                    },
                  });

                const eventQuizQuestionOption = questionOptions.map(
                  (option) => ({
                    eventQuizQuestionOptionId: option.id,
                    optionDescription: option.description,
                    isOther: option.isOther,
                    userResponse:
                      response.eventQuizQuestionOptionId === option.id,
                  }),
                );

                questionsResponsesMap.set(response.eventQuizQuestionId, {
                  responseId: response.id,
                  eventQuizQuestionId: response.eventQuizQuestionId,
                  questionDescription: response.eventQuizQuestion.description,
                  sequential: response.eventQuizQuestion.sequential,
                  questionType: response.eventQuizQuestion.questionType,
                  isMandatory: response.eventQuizQuestion.isMandatory,
                  multipleChoice: response.eventQuizQuestion.multipleChoice,
                  response: response.response,
                  eventQuizQuestionOption,
                });
                break;

              default:
                console.warn(
                  `Unknown question type: ${response.eventQuizQuestion.questionType}`,
                );
                break;
            }
          },
        ),
      );

      const questionsResponsesArray = Array.from(
        questionsResponsesMap.values(),
      );

      const response: EventParticipantResponseDto = {
        quizParticipantId: eventQuizParticipant.id,
        participantEmail: eventQuizParticipant.user.email,
        participantName: eventQuizParticipant.user.name,
        quizTitle: eventQuizParticipant.eventQuiz.title,

        questionsResponses: questionsResponsesArray,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async alterStatus(userEmail: string, slug: string, quizId: string) {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const quiz = await this.prisma.eventQuiz.findUnique({
        where: {
          id: quizId,
        },
      });

      if (!quiz) {
        throw new NotFoundException('Event quiz not found');
      }

      await this.prisma.eventQuiz.update({
        where: {
          id: quiz.id,
        },
        data: {
          status: quiz.status === 'ENABLE' ? 'DISABLE' : 'ENABLE',
        },
      });

      return 'success';
    } catch (error) {
      throw error;
    }
  }

  async createNewQuestion(
    userEmail: string,
    slug: string,
    quizId: string,
    body: EventQuizQuestionCreateDto[],
  ): Promise<EventQuizCreatedResponseDto> {
    try {
      const event = await this.userProducerValidationService.eventExists(
        slug,
        userEmail.toLowerCase(),
      );

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const quiz = await this.prisma.eventQuiz.findUnique({
        where: {
          id: quizId,
        },
        include: {
          EventQuizQuestion: true,
        },
      });

      if (!quiz) {
        throw new NotFoundException('Event quiz not found');
      }

      let sequential = quiz.EventQuizQuestion.length;

      body.map(async (q) => {
        if (
          q.questionType === 'MULTIPLE_CHOICE' &&
          q.questionOptions.length < 2
        ) {
          throw new BadRequestException(
            'At least two options required for multiple choice question',
          );
        }

        const questionCreated = await this.prisma.eventQuizQuestion.create({
          data: {
            eventQuizId: quiz.id,
            description: q.description,
            questionType: q.questionType,
            isMandatory: q.isMandatory,
            sequential: sequential + 1,
          },
        });

        if (q.questionOptions.length > 0) {
          const dataFormetted = q.questionOptions.map((o) => {
            return {
              description: o.description,
              sequential: o.sequential,
              eventQuizQuestionId: questionCreated.id,
              isOther: o.isOther,
            };
          });

          await this.prisma.eventQuizQuestionOption.createMany({
            data: dataFormetted,
          });
        }

        sequential++;
      });

      return {
        ok: 'Question created successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
