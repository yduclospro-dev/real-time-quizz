import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDec, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { SessionService } from '../session/session.service';
import { CreateQuizRequest } from './requests/create-quiz.request';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../../common/types/api-response';
import { QuizDto } from '../../common/types/quiz-dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { successResponse } from '../../common/http/api-response.util';
import { Role } from '@shared/enums/role';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly sessionService: SessionService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/start')
  @ApiOperation({ summary: 'Start quiz session', description: 'Creates and starts a new quiz session (Teacher only)' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponseDec({ status: 201, description: 'Session created successfully' })
  @ApiResponseDec({ status: 403, description: 'Only teachers can start sessions' })
  async startSession(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<{ sessionId: string }>> {
    if (user.role !== Role.TEACHER) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Seuls les enseignants peuvent démarrer une session',
      );
    }

    const session = await this.sessionService.createSessionForQuiz(id);
    return successResponse({ sessionId: session.id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Create quiz', description: 'Creates a new quiz with questions (Teacher only)' })
  @ApiBody({ type: CreateQuizRequest })
  @ApiResponseDec({ status: 201, description: 'Quiz created successfully' })
  @ApiResponseDec({ status: 403, description: 'Only teachers can create quizzes' })
  async createQuiz(
    @Body() request: CreateQuizRequest,
    @CurrentUser() jwtPayload: JwtPayload,
  ): Promise<ApiResponse<{ quiz: QuizDto }>> {
    if (jwtPayload.role !== Role.TEACHER) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Seuls les enseignants peuvent créer des quiz',
      );
    }

    const quiz = await this.quizService.createQuiz(request, jwtPayload.sub);
    return successResponse({ quiz });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID', description: 'Retrieves a quiz with all questions and answers' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponseDec({ status: 200, description: 'Quiz found' })
  @ApiResponseDec({ status: 404, description: 'Quiz not found' })
  async findById(@Param('id') id: string): Promise<ApiResponse<QuizDto>> {
    const quiz = await this.quizService.findByIdOrFail(id);
    return successResponse(quiz);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(): Promise<ApiResponse<{ quizzes: QuizDto[] }>> {
    const quizzes = await this.quizService.findAll();
    return successResponse({ quizzes });
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() request: CreateQuizRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<QuizDto>> {
    if (user.role !== Role.TEACHER) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Seuls les enseignants peuvent modifier des quiz',
      );
    }

    const quiz = await this.quizService.patchQuiz(id, request, user.sub);

    return successResponse(quiz);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteQuiz(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<null>> {
    if (user.role !== Role.TEACHER) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Seuls les enseignants peuvent supprimer des quiz',
      );
    }
    await this.quizService.deleteQuiz(id, user.sub);
    return successResponse(null);
  }
}
