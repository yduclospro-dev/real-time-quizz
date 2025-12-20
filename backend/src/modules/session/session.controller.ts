import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { ApiResponse } from '../../common/types/api-response';
import { successResponse } from '../../common/http/api-response.util';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { SessionDto } from '../../common/types/session-dto';
import { JoinSessionRequest } from './requests/join-session.request';
import { SubmitAnswerRequest } from './requests/submit-answer.request';
import { AdvanceSessionRequest } from './requests/advance-session.request';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('join')
  async join(
    @Body() body: JoinSessionRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<{ sessionId: string; quizId: string }>> {
    const result = await this.sessionService.joinSession(
      user.sub,
      body.sessionCode,
    );
    console.log('User joined session:', result);
    return successResponse(result);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async get(@Param('id') id: string): Promise<ApiResponse<SessionDto>> {
    const session = await this.sessionService.findByIdOrFail(id);
    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');
    return successResponse(session);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: SubmitAnswerRequest,
  ): Promise<ApiResponse<null>> {
    await this.sessionService.submitAnswer(
      id,
      user.sub,
      body.questionId,
      body.selectedAnswerIds,
    );
    return successResponse(null);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/advance')
  async advance(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: AdvanceSessionRequest,
  ): Promise<ApiResponse<any>> {
    const result = await this.sessionService.advanceQuestion(
      id,
      user.sub,
      body.nextQuestionIndex,
      body.timeLimitSeconds,
    );
    return successResponse(result);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/state')
  async state(@Param('id') id: string): Promise<ApiResponse<SessionDto>> {
    const state = await this.sessionService.getSessionState(id);
    return successResponse(state);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/start')
  async start(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<SessionDto>> {
    const session = await this.sessionService.startQuiz(id, user.sub);
    return successResponse(session);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/quiz')
  async quiz(@Param('id') id: string): Promise<ApiResponse<any>> {
    const quiz = await this.sessionService.getQuizForSession(id);
    return successResponse(quiz);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/results')
  async results(@Param('id') id: string): Promise<ApiResponse<any>> {
    const results = await this.sessionService.getResults(id);
    return successResponse(results);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/finish')
  async finish(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<SessionDto>> {
    const session = await this.sessionService.finishSession(id, user.sub);
    return successResponse(session);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/question-stats')
  async questionStats(@Param('id') id: string): Promise<ApiResponse<any>> {
    const stats = await this.sessionService.getCurrentQuestionStats(id);
    return successResponse(stats);
  }
}
