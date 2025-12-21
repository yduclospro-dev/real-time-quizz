import { QuestionType } from '@shared/enums/question-type';
import type { AnswerColor } from '@shared/types/answer-color';

export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  type: QuestionType;
  answers: QuizAnswer[];
  timeLimit: number;
}

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  color: AnswerColor;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface QuizListItem {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateQuizDto {
  title: string;
  questions: Array<{
    question: string;
    image?: string;
    type: QuestionType;
    answers: Omit<QuizAnswer, 'color'>[];
    timeLimit: number;
  }>;
}

export interface UpdateQuizDto {
  title?: string;
  questions?: Array<{
    question: string;
    image?: string;
    type: QuestionType;
    answers: Omit<QuizAnswer, 'color'>[];
    timeLimit: number;
  }>;
}
