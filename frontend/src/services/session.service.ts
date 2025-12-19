import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@shared/types/api-response";
import type { SessionApiResponse } from '@/types/session.types';

export const sessionService = {
  async join(sessionCode: string): Promise<{ sessionId: string; quizId: string }> {
    const response = await apiClient.post<ApiResponse<{ sessionId: string; quizId: string }>>(
      `/session/join`,
      { sessionCode }
    );
    const payload = response.data.data;
    if (!payload || !payload.sessionId || !payload.quizId) throw new Error('Invalid session response');
    return payload;
  },

  async get(sessionId: string): Promise<SessionApiResponse> {
    const response = await apiClient.get<ApiResponse<SessionApiResponse>>(`/session/${sessionId}`);
    return response.data.data as SessionApiResponse;
  },
};
