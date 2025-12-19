import { Question, Answer } from '@prisma/client';
import { QuestionType } from '@shared/enums/question-type';
import { AnswerDto, answerToDto } from './answer-dto';

export interface QuestionDto {
  id: string;
  text: string;
  type: QuestionType;
  image?: string | null;
  timeLimit: number;
  answers: AnswerDto[];
}

export const questionToDto = (
  entity: Question & { answers?: Answer[] },
): QuestionDto => ({
  id: entity.id,
  text: entity.text,
  type: entity.type as QuestionType,
  image: entity.image,
  timeLimit: entity.timeLimit ?? 30,
  answers: (entity.answers ?? []).map(answerToDto),
});
