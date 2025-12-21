import { Body, Controller, Get, Param, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDec, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
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

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join quiz session', description: 'Join an active quiz session using a session code' })
  @ApiBody({ type: JoinSessionRequest })
  @ApiResponseDec({ status: 200, description: 'Successfully joined session' })
  @ApiResponseDec({ status: 404, description: 'Session not found' })
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
  @Get('history')
  @ApiOperation({ summary: 'Get user session history', description: 'Get all sessions the user participated in (as teacher or student)' })
  @ApiResponseDec({ status: 200, description: 'Session history retrieved' })
  async getUserHistory(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<any[]>> {
    const sessions = await this.sessionService.getUserSessionHistory(user.sub);
    return successResponse(sessions);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: 'Get session', description: 'Get session details by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Session found' })
  @ApiResponseDec({ status: 404, description: 'Session not found' })
  async get(@Param('id') id: string): Promise<ApiResponse<SessionDto>> {
    const session = await this.sessionService.findByIdOrFail(id);
    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');
    return successResponse(session);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answer', description: 'Submit an answer for the current question' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({ type: SubmitAnswerRequest })
  @ApiResponseDec({ status: 200, description: 'Answer submitted successfully' })
  @ApiResponseDec({ status: 404, description: 'Session or participant not found' })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance to next question', description: 'Move to the next question in the quiz (Teacher only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({ type: AdvanceSessionRequest })
  @ApiResponseDec({ status: 200, description: 'Advanced to next question' })
  @ApiResponseDec({ status: 403, description: 'Only teachers can advance questions' })
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
  @ApiOperation({ summary: 'Get session state', description: 'Get current state of the session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Session state retrieved' })
  async state(@Param('id') id: string): Promise<ApiResponse<SessionDto>> {
    const state = await this.sessionService.getSessionState(id);
    return successResponse(state);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start quiz', description: 'Start the quiz from lobby state (Teacher only). This advances to the first question.' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Quiz started successfully' })
  @ApiResponseDec({ status: 403, description: 'Only teachers can start the quiz' })
  async start(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<SessionDto>> {
    const session = await this.sessionService.startQuiz(id, user.sub);
    return successResponse(session);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/quiz')
  @ApiOperation({ summary: 'Get session quiz', description: 'Get the quiz associated with this session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Quiz retrieved' })
  async quiz(@Param('id') id: string): Promise<ApiResponse<any>> {
    const quiz = await this.sessionService.getQuizForSession(id);
    return successResponse(quiz);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/results')
  @ApiOperation({ summary: 'Get session results', description: 'Get final results for the session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Results retrieved' })
  async results(@Param('id') id: string): Promise<ApiResponse<any>> {
    const results = await this.sessionService.getResults(id);
    return successResponse(results);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finish session', description: 'Mark the session as finished (Teacher only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Session finished successfully' })
  @ApiResponseDec({ status: 403, description: 'Only teachers can finish sessions' })
  async finish(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<SessionDto>> {
    const session = await this.sessionService.finishSession(id, user.sub);
    return successResponse(session);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/question-stats')
  @ApiOperation({ summary: 'Get question statistics', description: 'Get statistics for the current question (how many students answered)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponseDec({ status: 200, description: 'Statistics retrieved' })
  async questionStats(@Param('id') id: string): Promise<ApiResponse<any>> {
    const stats = await this.sessionService.getCurrentQuestionStats(id);
    return successResponse(stats);
  }
}
