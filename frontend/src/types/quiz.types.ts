export type QuestionType = "single" | "multiple";

export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string; // Cloudinary URL (to be implemented by backend)
  type: QuestionType;
  answers: QuizAnswer[];
  timeLimit: number; // in seconds
}

import type { AnswerColor } from '@shared/types/answer-color';

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
  description?: string;
  questions: Omit<QuizQuestion, "id">[];
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  questions?: Omit<QuizQuestion, "id">[];
}
