import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserProducerService } from './user-producer.service';
import { UserProducerCreateDto } from './dto/user-producer-create.dto';
import { UserProducerFinishSignUpDto } from './dto/user-producer-finish-sign-up.dto';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { UserProducerResponseDto } from './dto/user-producer-response.dto';

@ApiTags('User Producer')
@Controller('user-producer')
export class UserProducerController {
  constructor(private readonly userProducerService: UserProducerService) {}

  @Post('v1/user-producer/sign-up')
  @ApiOperation({ summary: 'Register user producer' })
  @ApiCreatedResponse({
    description: 'User producer created',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    type: UserProducerCreateDto,
  })
  async createUserProducer(
    @Body() body: UserProducerCreateDto,
  ): Promise<String> {
    return await this.userProducerService.createUserProducer(body);
  }

  @Patch('v1/user-producer/finish-register')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Finish register user producer' })
  @ApiResponse({
    description: 'Finish register user producer',
    type: String,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    type: UserProducerFinishSignUpDto,
  })
  async finishSignUp(
    @Body() body: UserProducerFinishSignUpDto,
    @Request() req: any,
  ): Promise<String> {
    const email = req.auth.user.email;
    return await this.userProducerService.finishSignUp(email, body);
  }

  @Get('v1/user-producer/profile')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get user production' })
  @ApiResponse({
    description: 'Get user production',
    type: UserProducerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findOneUserProducer(
    @Request() req: any,
  ): Promise<UserProducerResponseDto> {
    const email = req.auth.user.email;
    return this.userProducerService.findOneUserProducer(email);
  }




}
