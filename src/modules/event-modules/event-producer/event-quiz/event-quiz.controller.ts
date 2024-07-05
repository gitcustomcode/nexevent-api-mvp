import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventQuizService } from './event-quiz.service';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import {
  EventQuizCreateDto,
  EventQuizQuestionCreateDto,
} from './dto/event-quiz-create.dto';
import {
  EventQuizDashboarDto,
  EventQuizFindAllResponse,
  EventQuizParticipantsResponse,
} from './dto/event-quiz-response.dto';

@ApiTags('Event Quiz')
@Controller('event-quiz')
export class EventQuizController {
  constructor(private readonly eventQuizService: EventQuizService) {}

  @Post('v1/event-quiz/:slug/create-quiz')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create event quiz' })
  @ApiCreatedResponse({
    description: 'Event quiz created successfully',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiBody({
    type: EventQuizCreateDto,
  })
  async createQuiz(
    @Param('slug') slug: string,
    @Body() body: EventQuizCreateDto,
    @Request() req: any,
  ): Promise<string> {
    const email = req.auth.user.email;
    return this.eventQuizService.createQuiz(email, slug, body);
  }

  @Get('v1/event-quiz/:slug/find-all-quizzes')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Find all quizzes for an event' })
  @ApiResponse({
    description: 'List of quizzes',
    type: EventQuizFindAllResponse,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: Number,
  })
  async findAllQuizzes(
    @Param('slug') slug: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ): Promise<EventQuizFindAllResponse> {
    const email = req.auth.user.email;
    return this.eventQuizService.findAllQuizzes(
      email,
      slug,
      Number(page),
      Number(perPage),
    );
  }

  @Get('v1/event-quiz/:slug/quiz-dashboard/:quizId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get quiz dashboard details' })
  @ApiResponse({
    description: 'Quiz dashboard details',
    type: EventQuizDashboarDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'quizId',
    required: true,
    type: String,
  })
  async quizDashboard(
    @Param('slug') slug: string,
    @Param('quizId') quizId: string,
    @Request() req: any,
  ): Promise<EventQuizDashboarDto> {
    const email = req.auth.user.email;
    return this.eventQuizService.quizDashboard(email, slug, quizId);
  }

  @Get('v1/event-quiz/:slug/quiz-participants/:quizId')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get quiz participants responses' })
  @ApiResponse({
    description: 'Quiz participants responses',
    type: EventQuizParticipantsResponse,
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'quizId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    type: Number,
  })
  async quizParticipantsResponse(
    @Param('slug') slug: string,
    @Param('quizId') quizId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Request() req: any,
  ): Promise<EventQuizParticipantsResponse> {
    const email = req.auth.user.email;
    return this.eventQuizService.quizParticipantsResponse(
      email,
      slug,
      quizId,
      page,
      perPage,
    );
  }

  @Patch('v1/event-quiz/:slug/quiz/:quizId/alter-status')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Alter quiz status' })
  @ApiResponse({
    description: 'Quiz status altered successfully',
    type: String,
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'quizId',
    required: true,
    type: String,
  })
  async alterQuizStatus(
    @Param('slug') slug: string,
    @Param('quizId') quizId: string,
    @Request() req: any,
  ): Promise<string> {
    const email = req.auth.user.email;
    return this.eventQuizService.alterStatus(email, slug, quizId);
  }

  @Post('v1/event-quiz/:slug/quiz/:quizId/create-questions')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create new quiz questions' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'quizId',
    required: true,
    type: String,
  })
  @ApiBody({
    type: [EventQuizQuestionCreateDto],
    isArray: true,
  })
  async createQuizQuestions(
    @Param('slug') slug: string,
    @Param('quizId') quizId: string,
    @Body() body: EventQuizQuestionCreateDto[],
    @Request() req: any,
  ): Promise<string> {
    const userEmail = req.auth.user.email;
    return this.eventQuizService.createNewQuestion(
      userEmail,
      slug,
      quizId,
      body,
    );
  }
}
