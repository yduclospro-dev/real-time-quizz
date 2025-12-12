import { apiClient } from "@/lib/api-client";
import type {
  Quiz,
  QuizListItem,
  CreateQuizDto,
  UpdateQuizDto,
} from "@/types/quiz.types";
import type { ServerQuizDto, ServerQuestionDto, ServerAnswerDto } from '@shared/types/server-quiz-dto';
import type { AnswerColor } from '@shared/types/answer-color';
import type { ApiResponse } from "@shared/types/api-response";

export const quizService = {
  // Map backend DTO -> UI Quiz shape
  mapServerQuizToUI(server: ServerQuizDto): Quiz {
    const DEFAULT_ANSWER_COLORS: AnswerColor[] = [
      'red',
      'blue',
      'yellow',
      'green',
      'purple',
      'orange',
    ];

    console.log("Mapping server quiz to UI:", server);

    return {
      ...server,
      questions: (server.questions || []).map((q: ServerQuestionDto) => ({
        id: q.id,
        question: q.text ?? '',
        imageUrl: q.image ?? undefined,
        type: q.type === 'SINGLE_CHOICE' ? 'single' : 'multiple',
        answers: (q.answers || []).map((a: ServerAnswerDto, idx: number) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
          color: (a.color ?? DEFAULT_ANSWER_COLORS[idx % DEFAULT_ANSWER_COLORS.length]) as AnswerColor,
        })),
        timeLimit: q.timeLimit ?? 30,
      })),
    } as Quiz;
  },
  async getQuizzes(): Promise<QuizListItem[]> {
    const response = await apiClient.get<ApiResponse<{ quizzes: QuizListItem[] }>>("/quiz");
    const payload = response.data.data;
    if (!payload) return [];
    return payload.quizzes;
  },

  async getQuizById(id: string): Promise<Quiz> {
    const response = await apiClient.get<ApiResponse<ServerQuizDto | { quiz: ServerQuizDto }>>(`/quiz/${id}`);
    console.log("API response for getQuizById:", response.data);
    const payload = response.data.data;
    if (!payload) throw new Error('Quiz not found');
    const server: ServerQuizDto = ((payload as { quiz?: ServerQuizDto }).quiz ?? (payload as ServerQuizDto)) as ServerQuizDto;
    return quizService.mapServerQuizToUI(server);
  },

  async createQuiz(data: CreateQuizDto): Promise<Quiz> {
    // Transform frontend DTO to backend expected shape
    const payload = {
      title: data.title,
      questions: data.questions.map((q) => ({
        text: q.question,
        image: q.imageUrl,
        type: q.type === 'single' ? 'SINGLE_CHOICE' : 'MULTIPLE_CHOICE',
        timeLimit: q.timeLimit,
        answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
      })),
    };

    const response = await apiClient.post<ApiResponse<{ quiz: ServerQuizDto }>>("/quiz", payload);
    const respPayload = response.data.data as { quiz: ServerQuizDto } | null;
    if (!respPayload || !respPayload.quiz) throw new Error('Failed to create quiz');
    return quizService.mapServerQuizToUI(respPayload.quiz);
  },

  async updateQuiz(id: string, data: UpdateQuizDto): Promise<Quiz> {
    const payload = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.questions && {
        questions: data.questions.map((q) => ({
          text: q.question,
          image: q.imageUrl,
          type: q.type === 'single' ? 'SINGLE_CHOICE' : 'MULTIPLE_CHOICE',
          timeLimit: q.timeLimit,
          answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
        })),
      }),
    };

    const response = await apiClient.put<ApiResponse<{ quiz: ServerQuizDto }>>(`/quiz/${id}`, payload);
    console.log("API response for updateQuiz:", response.data);
    const respPayload = response.data.data as ServerQuizDto | null;
    console.log("Response payload for updateQuiz:", respPayload);
    if (!respPayload) throw new Error('Failed to update quiz');
    return quizService.mapServerQuizToUI(respPayload);
  },

  async deleteQuiz(id: string): Promise<void> {
    await apiClient.delete(`/quiz/${id}`);
  },

  async startSession(quizId: string): Promise<{ sessionId: string }> {
    // backend currently does not expose a session controller; try POST /quiz/:id/start
    const response = await apiClient.post<ApiResponse<{ sessionId: string }>>(`/quiz/${quizId}/start`);
    const payload = response.data.data;
    if (!payload || !payload.sessionId) throw new Error('Failed to start session');
    return payload;
  },
};
