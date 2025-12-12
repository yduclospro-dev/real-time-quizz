import { Answer } from '@prisma/client';

export interface AnswerDto {
  id: string;
  text: string;
  isCorrect: boolean;
}

export const answerToDto = (entity: Answer): AnswerDto => ({
  id: entity.id,
  text: entity.text,
  isCorrect: entity.isCorrect,
});
