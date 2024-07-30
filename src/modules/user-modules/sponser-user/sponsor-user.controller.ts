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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SponsorUserService } from './sponsor-user.service';
import { CreateSponsorUserDto } from './dto/create-sponser-user.dto';
import { ResponseSponsorUserDto } from './dto/response-sponser-user.dto';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-user.guards';
import { UpdateSponsorUserDto } from './dto/update-sponser-user.dto';

@ApiTags('Sponsor User')
@Controller('sponsor-user')
export class SponsorUserController {
  constructor(private readonly sponsorUserService: SponsorUserService) {}

  @Post('v1/sponsor-user')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Create Sponsor User' })
  @ApiCreatedResponse({
    type: ResponseSponsorUserDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    type: CreateSponsorUserDto,
  })
  async createSponsorUser(
    @Request() req: any,
    @Body() body: CreateSponsorUserDto,
  ): Promise<ResponseSponsorUserDto> {
    const userId = req.auth.user.id;
    return this.sponsorUserService.createSponsor(userId, body);
  }

  @Get('v1/sponsor-user')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Get Sponsor User' })
  @ApiResponse({
    status: 200,
    type: ResponseSponsorUserDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getSponserUser(
    @Request() req: any,
  ): Promise<ResponseSponsorUserDto | null> {
    const userId = req.auth.user.id;
    return this.sponsorUserService.findSponsorUser(userId);
  }

  @Patch('v1/sponsor-user')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiOperation({ summary: 'Update Sponsor User' })
  @ApiResponse({
    status: 200,
    type: ResponseSponsorUserDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    type: UpdateSponsorUserDto,
  })
  async update(
    @Request() req: any,
    @Body() body: UpdateSponsorUserDto,
  ): Promise<ResponseSponsorUserDto> {
    const userId = req.auth.user.id;
    return await this.sponsorUserService.update(userId, body);
  }
}
