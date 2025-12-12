import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
}
