import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { SessionDto, sessionToDto } from '../../common/types/session-dto';
import { mapSessionState } from '../../common/types/session-dto';
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSessionForQuiz(quizId: string): Promise<SessionDto> {
    const code = nanoid(6).toUpperCase();

    const session = await this.prisma.session.create({
      data: {
        code,
        quizId,
      },
    });

    return sessionToDto(session);
  }

  async findByCode(code: string): Promise<SessionDto> {
    const session = await this.prisma.session.findUnique({
      where: { code },
      include: { quiz: true },
    });

    if (!session) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');
    }

    return sessionToDto(session);
  }

  async findByIdOrFail(id: string): Promise<SessionDto> {
    const session = await this.prisma.session.findUnique({ where: { id } });

    if (!session) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');
    }

    return sessionToDto(session);
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    selectedAnswerIds: string[],
  ) {
    const participant = await this.prisma.sessionParticipant.findFirst({
      where: { sessionId, userId },
    });
    if (!participant) {
      throw new ApiException(
        404,
        ErrorCode.NOT_FOUND,
        'Participant introuvable pour cette session',
      );
    }

    await this.prisma.answerSubmission.create({
      data: {
        sessionId,
        participantId: participant.id,
        questionId,
        selectedAnswerIds: selectedAnswerIds as any,
      },
    });
  }

  async advanceQuestion(
    sessionId: string,
    userId: string,
    nextQuestionIndex?: number,
    timeLimitSeconds?: number,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { quiz: true },
    });
    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');

    if (session.quiz.authorId !== userId) {
      throw new ApiException(
        403,
        ErrorCode.FORBIDDEN,
        'Vous ne pouvez pas avancer les questions de cette session',
      );
    }

    const newIndex = nextQuestionIndex ?? session.currentQuestionIndex + 1;
    const endsAt = timeLimitSeconds
      ? new Date(Date.now() + timeLimitSeconds * 1000)
      : session.currentQuestionEndsAt
        ? new Date(
            session.currentQuestionEndsAt.getTime() +
              (timeLimitSeconds ?? 30) * 1000,
          )
        : new Date(Date.now() + 30000);

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { currentQuestionIndex: newIndex, currentQuestionEndsAt: endsAt },
    });

    return {
      currentQuestionIndex: updated.currentQuestionIndex,
      currentQuestionEndsAt: updated.currentQuestionEndsAt,
    };
  }

  async getSessionState(sessionId: string): Promise<SessionDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { participants: true },
    });
    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');

    return {
      id: session.id,
      quizId: session.quizId,
      code: session.code,
      state: mapSessionState(session.state),
      currentSessionIndex: session.currentQuestionIndex,
      currentQuestionEndsAt: session.currentQuestionEndsAt ?? undefined,
      participants: session.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        isConnected: p.isConnected,
      })),
      createdAt: session.createdAt.toISOString(),
    };
  }

  async joinSession(userId: string, code: string) {
    const session = await this.findByCode(code);
    if (!session) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');
    }

    // prevent duplicate join
    const existing = await this.prisma.sessionParticipant.findFirst({
      where: { sessionId: session.id, userId },
    });
    if (existing) {
      return { sessionId: session.id, quizId: session.quizId };
    }

    return { sessionId: session.id, quizId: session.quizId };
  }
}
