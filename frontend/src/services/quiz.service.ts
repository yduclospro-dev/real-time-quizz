import { apiClient } from "@/lib/api-client";
import type {
  Quiz,
  QuizListItem,
  CreateQuizDto,
  UpdateQuizDto,
} from "@/types/quiz.types";

export const quizService = {
  async getQuizzes(): Promise<QuizListItem[]> {
    const response = await apiClient.get<QuizListItem[]>("/quizzes");
    return response.data;
  },

  async getQuizById(id: string): Promise<Quiz> {
    const response = await apiClient.get<Quiz>(`/quizzes/${id}`);
    return response.data;
  },

  async createQuiz(data: CreateQuizDto): Promise<Quiz> {
    const response = await apiClient.post<Quiz>("/quizzes", data);
    return response.data;
  },

  async updateQuiz(id: string, data: UpdateQuizDto): Promise<Quiz> {
    const response = await apiClient.put<Quiz>(`/quizzes/${id}`, data);
    return response.data;
  },

  async deleteQuiz(id: string): Promise<void> {
    await apiClient.delete(`/quizzes/${id}`);
  },

  async startSession(quizId: string): Promise<{ sessionId: string }> {
    const response = await apiClient.post<{ sessionId: string }>(
      `/sessions/start`,
      { quizId }
    );
    return response.data;
  },
};
