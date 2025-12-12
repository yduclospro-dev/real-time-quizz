import type { AnswerColor } from './answer-color';

export interface ServerAnswerDto {
  id: string;
  text: string;
  isCorrect: boolean;
  color?: AnswerColor;
}

export interface ServerQuestionDto {
  id: string;
  text: string;
  image?: string | null;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  answers: ServerAnswerDto[];
  timeLimit?: number | null;
}

export interface ServerQuizDto {
  id: string;
  title: string;
  description?: string | null;
  questions: ServerQuestionDto[];
  createdBy: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}
