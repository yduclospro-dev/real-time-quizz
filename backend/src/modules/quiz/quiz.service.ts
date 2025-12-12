import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuestionRequest,
  CreateQuizRequest,
} from './requests/create-quiz.request';
import { Prisma } from '@prisma/client';
import { QuizDto, quizToDto } from '../../common/types/quiz-dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { UpdateQuizRequest } from './requests/update-quiz.request';
import { QuestionType } from '@shared/enums/question-type';

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

    this.validateQuestions(request.questions);

    request.questions.forEach((question, index) => {
      if (question.answers.length < 2) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chaque question doit avoir au moins 2 réponses',
          [
            {
              field: `questions.${index}.answers`,
              message: 'Au moins 2 réponses sont requises',
            },
          ],
        );
      }

      if (!question.answers.some((a) => a.isCorrect)) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chaque question doit avoir au moins une réponse correcte',
          [
            {
              field: `questions.${index}.answers`,
              message: 'Aucune réponse correcte sélectionnée',
            },
          ],
        );
      }

      this.validateQuestionAnswers(
        question.answers,
        `questions.${index}.answers`,
      );
    });

    const quiz = await this.prisma.quiz.create({
      data: {
        title: request.title,
        authorId,
        questions: {
          create: request.questions.map((q) => ({
            text: q.text,
            type: q.type,
            timeLimit: q.timeLimit ?? 30,
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

  async findByIdOrFail(id: string): Promise<QuizDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    if (!quiz) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Quiz introuvable');
    }

    return quizToDto(quiz);
  }

  async findAll(): Promise<QuizDto[]> {
    const quizzes = await this.prisma.quiz.findMany({
      include: {
        questions: {
          include: { answers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map(quizToDto);
  }

  async patchQuiz(
    quizId: string,
    request: UpdateQuizRequest,
    authorId: string,
  ): Promise<QuizDto> {
    const existing = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    if (!existing) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Quiz introuvable');
    }

    if (existing.authorId !== authorId) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Vous ne pouvez pas modifier ce quiz',
      );
    }

    if (request.questions) {
      this.validateQuestions(request.questions);
    }

    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(request.title !== undefined && {
          title: request.title,
        }),

        ...(request.questions && {
          questions: {
            deleteMany: {}, // on remplace l’arbre complet
            create: request.questions.map((q) => ({
              text: q.text,
              type: q.type,
              timeLimit: q.timeLimit ?? 30,
              answers: {
                create: q.answers.map((a) => ({
                  text: a.text,
                  isCorrect: a.isCorrect,
                })),
              },
            })),
          },
        }),
      },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    return quizToDto(quiz);
  }

  async deleteQuiz(quizId: string, authorId: string): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Quiz introuvable');
    }

    if (quiz.authorId !== authorId) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Vous ne pouvez pas supprimer ce quiz',
      );
    }

    await this.prisma.quiz.delete({
      where: { id: quizId },
    });
  }

  private validateQuestions(questions: CreateQuestionRequest[]) {
    questions.forEach((question, index) => {
      const answersPath = `questions.${index}.answers`;

      if (question.answers.length < 2) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chaque question doit avoir au moins 2 réponses',
          [
            {
              field: answersPath,
              message: 'Au moins 2 réponses sont requises',
            },
          ],
        );
      }

      const correctAnswers = question.answers.filter((a) => a.isCorrect);

      if (correctAnswers.length === 0) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Chaque question doit avoir au moins une réponse correcte',
          [
            {
              field: answersPath,
              message: 'Aucune réponse correcte sélectionnée',
            },
          ],
        );
      }

      if (
        (question.type as QuestionType) === QuestionType.SINGLE_CHOICE &&
        correctAnswers.length !== 1
      ) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Une question à choix unique doit avoir exactement une réponse correcte',
          [
            {
              field: answersPath,
              message: 'Une seule réponse correcte est autorisée',
            },
          ],
        );
      }

      // ✅ ici seulement
      this.validateQuestionAnswers(question.answers, answersPath);
    });
  }

  private validateQuestionAnswers(
    answers: { text: string; isCorrect: boolean }[],
    fieldPath: string,
  ) {
    const normalized = answers.map((a) => a.text.trim().toLowerCase());

    if (new Set(normalized).size !== normalized.length) {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Une question contient des réponses dupliquées',
        [
          {
            field: fieldPath,
            message: 'Les réponses doivent être uniques',
          },
        ],
      );
    }
  }
}
