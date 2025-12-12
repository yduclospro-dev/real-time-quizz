import { Question } from '@prisma/client';
import { QuestionType } from '../../../../shared/enums/question-type';
import { AnswerDto, answerToDto } from './answer-dto';

export interface QuestionDto {
  id: string;
  text: string;
  type: QuestionType;
  image?: string | null;
  answers: AnswerDto[];
}

export const questionToDto = (
  entity: Question & { answers: any[] },
): QuestionDto => ({
  id: entity.id,
  text: entity.text,
  type: entity.type as QuestionType,
  image: entity.image,
  answers: entity.answers.map(answerToDto),
});
