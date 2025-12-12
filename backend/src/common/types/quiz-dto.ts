import { Quiz } from '@prisma/client';
import { QuestionDto, questionToDto } from './question-dto';

export interface QuizDto {
  id: string;
  title: string;
  authorId: string;
  createdAt: Date;
  questions: QuestionDto[];
}

export const quizToDto = (entity: Quiz & { questions: any[] }): QuizDto => ({
  id: entity.id,
  title: entity.title,
  authorId: entity.authorId,
  createdAt: entity.createdAt,
  questions: entity.questions.map(questionToDto),
});
