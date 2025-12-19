import type { SessionState } from '@shared/enums/session-state';

export interface ServerSessionDto {
  id: string;
  quizId: string;
  hostId: string;
  code: string;
  state: SessionState;
  createdAt: string;
  participants?: string[];
}