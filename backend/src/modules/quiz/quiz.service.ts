import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizRequest } from './requests/create-quiz.request';
import { Prisma } from '@prisma/client';
import { QuizDto, quizToDto } from '../../common/types/quiz-dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';

export type QuizWithQuestions = Prisma.QuizGetPayload<{
  include: {
    questions: {
      include: {
        answers: true;
      };
    };
  };
}>;

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuiz(
    request: CreateQuizRequest,
    authorId: string,
  ): Promise<QuizDto> {
    if (!request.questions || request.questions.length === 0) {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Le quiz doit contenir au moins une question',
      );
    }

    this.validateUniqueQuestions(request.questions);

    for (const question of request.questions) {
      if (question.answers.length < 2) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chaque question doit avoir au moins 2 réponses',
        );
      }

      if (!question.answers.some((a) => a.isCorrect)) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chaque question doit avoir au moins une réponse correcte',
        );
      }

      this.validateQuestionAnswers(question.answers);
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        title: request.title,
        authorId,
        questions: {
          create: request.questions.map((q) => ({
            text: q.text,
            type: q.type,
            answers: {
              create: q.answers,
            },
          })),
        },
      },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    quiz.questions.forEach((q) =>
      q.answers.sort((a, b) => a.text.localeCompare(b.text)),
    );

    return quizToDto(quiz);
  }

  private validateUniqueQuestions(questions: { text: string }[]) {
    const normalized = questions.map((q) => q.text.trim().toLowerCase());

    const unique = new Set(normalized);

    if (unique.size !== normalized.length) {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Le quiz contient des questions dupliquées',
        [
          {
            field: 'questions',
            message: 'Les questions doivent être uniques',
          },
        ],
      );
    }
  }

  private validateQuestionAnswers(
    answers: { text: string; isCorrect: boolean }[],
  ) {
    const normalized = answers.map((a) => a.text.trim().toLowerCase());

    const unique = new Set(normalized);

    if (unique.size !== normalized.length) {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Une question contient des réponses dupliquées',
        [
          {
            field: 'answers',
            message: 'Les réponses doivent être uniques',
          },
        ],
      );
    }
  }
}
