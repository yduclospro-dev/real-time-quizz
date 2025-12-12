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
import { QuizService } from './quiz.service';
import { CreateQuizRequest } from './requests/create-quiz.request';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../../common/types/api-response';
import { QuizDto } from '../../common/types/quiz-dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { successResponse } from '../../common/http/api-response.util';
import { Role } from '../../../../shared/enums/role';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
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
