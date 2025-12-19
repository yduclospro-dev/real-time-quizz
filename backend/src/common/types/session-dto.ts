import { SessionState } from '@shared/enums/session-state';
import {
  SessionState as PrismaSession,
  Session,
  SessionParticipant,
} from '@prisma/client';

export interface SessionDto {
  id: string;
  quizId: string;
  code: string;
  state: SessionState;
  createdAt: string;
  currentSessionIndex?: number;
  currentQuestionEndsAt?: Date;
  participants?: {
    id: string;
    displayName: string;
    isConnected: boolean;
  }[];
}

export const sessionToDto = (
  entity: Session & { participants?: SessionParticipant[] },
): SessionDto => ({
  id: entity.id,
  quizId: entity.quizId,
  code: entity.code,
  state: mapSessionState(entity.state),
  createdAt: entity.createdAt.toISOString(),
  currentSessionIndex: entity.currentQuestionIndex,
  currentQuestionEndsAt: entity.currentQuestionEndsAt ?? undefined,
  participants: entity.participants?.map((p: SessionParticipant) => ({
    id: p.id,
    displayName: p.displayName,
    isConnected: p.isConnected,
  })),
});

export const mapSessionState = (state: PrismaSession): SessionState => {
  switch (state) {
    case 'CREATED':
      return SessionState.CREATED;
    case 'STARTED':
      return SessionState.STARTED;
    case 'FINISHED':
      return SessionState.FINISHED;
  }
};
