import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@shared/types/api-response";
import type { SessionApiResponse } from '@/types/session.types';

export const sessionService = {
  // Join session via REST (initial handshake)
  async join(sessionCode: string): Promise<{ sessionId: string; quizId: string }> {
    const response = await apiClient.post<ApiResponse<{ sessionId: string; quizId: string }>>(
      `/session/join`,
      { sessionCode }
    );
    const payload = response.data.data;
    if (!payload || !payload.sessionId || !payload.quizId) throw new Error('Invalid session response');
    return payload;
  },

  // Get session details (initial load)
  async get(sessionId: string): Promise<SessionApiResponse> {
    const response = await apiClient.get<ApiResponse<SessionApiResponse>>(`/session/${sessionId}`);
    return response.data.data as SessionApiResponse;
  },

  // Get quiz questions for session (initial load)
  async getQuiz(sessionId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/session/${sessionId}/quiz`);
    return response.data.data;
  },

  // Get final results (after session ends)
  async getResults(sessionId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/session/${sessionId}/results`);
    return response.data.data;
  },
};
