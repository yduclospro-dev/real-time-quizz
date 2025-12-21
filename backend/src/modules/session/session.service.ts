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

    // Get the question with correct answers
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { answers: true },
    });

    if (!question) {
      throw new ApiException(
        404,
        ErrorCode.NOT_FOUND,
        'Question introuvable',
      );
    }

    // Calculate if answer is correct
    const correctAnswerIds = question.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id)
      .sort();
    const sortedSelectedIds = [...selectedAnswerIds].sort();
    const isCorrect =
      correctAnswerIds.length === sortedSelectedIds.length &&
      correctAnswerIds.every((id, idx) => id === sortedSelectedIds[idx]);

    // Check if submission already exists for this participant and question
    const existingSubmission = await this.prisma.answerSubmission.findFirst({
      where: {
        participantId: participant.id,
        questionId,
      },
    });

    if (existingSubmission) {
      // Update existing submission
      await this.prisma.answerSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          selectedAnswerIds: selectedAnswerIds as any,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new submission
      await this.prisma.answerSubmission.create({
        data: {
          sessionId,
          participantId: participant.id,
          questionId,
          selectedAnswerIds: selectedAnswerIds as any,
        },
      });
    }

    return { isCorrect };
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
      include: { 
        participants: true,
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
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
      totalQuestions: session.quiz?.questions?.length || 0,
      questions: session.quiz?.questions?.map(q => ({
        id: q.id,
        text: q.text,
        image: q.image,
        type: q.type,
        timeLimit: q.timeLimit,
        answers: q.answers.map(a => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      })) || [],
      participants: session.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        isConnected: p.isConnected,
      })),
      createdAt: session.createdAt.toISOString(),
    };
  }
  
  async getSessionWithSubmissions(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        participants: {
          include: {
            answerSubmissions: true,
          },
        },
      },
    });
    
    return session;
  }

  async joinSession(userId: string, code: string) {
    const session = await this.findByCode(code);
    if (!session) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');
    }

    // Get user to create display name
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Utilisateur introuvable');
    }

    // prevent duplicate join
    const existing = await this.prisma.sessionParticipant.findFirst({
      where: { sessionId: session.id, userId },
    });
    if (existing) {
      return { sessionId: session.id, quizId: session.quizId };
    }

    // Create participant
    await this.prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        userId,
        displayName: `${user.firstName} ${user.lastName}`,
        isConnected: true,
      },
    });

    return { sessionId: session.id, quizId: session.quizId };
  }

  async startQuiz(sessionId: string, userId: string) {
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
        'Seul le créateur peut démarrer la session',
      );
    }

    if (session.state !== 'CREATED') {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'La session a déjà été démarrée',
      );
    }

    // Start the quiz with the first question
    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        state: 'STARTED',
        startedAt: new Date(),
        currentQuestionIndex: 0,
        currentQuestionEndsAt: new Date(Date.now() + 30000), // 30 seconds default
      },
    });

    return sessionToDto(updated);
  }

  async getQuizForSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');

    return session.quiz;
  }

  async getResults(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        participants: {
          include: {
            answerSubmissions: {
              include: {
                question: {
                  include: {
                    answers: true,
                  },
                },
              },
            },
            user: true,
          },
        },
      },
    });

    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');

    // Calculate scores for each participant
    const results = session.participants.map((participant) => {
      let score = 0;
      const totalQuestions = session.quiz.questions.length;
      const answers: Array<{
        questionId: string;
        selectedAnswerIds: string[];
        isCorrect: boolean;
        submittedAt: string | null;
      }> = [];

      // Build answer details for each question
      session.quiz.questions.forEach((question) => {
        // Get ALL submissions for this question and take the latest
        const questionSubmissions = participant.answerSubmissions.filter(
          (sub) => sub.questionId === question.id,
        );
        const submission = questionSubmissions.sort(
          (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
        )[0];

        const correctAnswerIds = question.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id)
          .sort();

        let selectedIds: string[] = [];
        let isCorrect = false;

        if (submission) {
          selectedIds = (submission.selectedAnswerIds as string[]).sort();
          isCorrect =
            correctAnswerIds.length === selectedIds.length &&
            correctAnswerIds.every((id, idx) => id === selectedIds[idx]);

          if (isCorrect) score++;
        }

        answers.push({
          questionId: question.id,
          selectedAnswerIds: selectedIds,
          isCorrect,
          submittedAt: submission?.submittedAt?.toISOString() || null,
        });
      });

      return {
        participantId: participant.id,
        userId: participant.userId,
        displayName: participant.displayName,
        score,
        totalQuestions,
        percentage: totalQuestions > 0 ? (score / totalQuestions) * 100 : 0,
        answers,
      };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return {
      sessionId: session.id,
      quizTitle: session.quiz.title,
      state: session.state,
      results,
      questions: session.quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        answers: q.answers.map((a) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
        correctAnswerIds: q.answers.filter((a) => a.isCorrect).map((a) => a.id),
      })),
    };
  }

  async finishSession(sessionId: string, userId: string) {
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
        'Seul le créateur peut terminer la session',
      );
    }

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        state: 'FINISHED',
        endedAt: new Date(),
      },
    });

    return sessionToDto(updated);
  }

  async getCurrentQuestionStats(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        participants: {
          include: {
            answerSubmissions: true,
          },
        },
      },
    });

    if (!session)
      throw new ApiException(404, ErrorCode.NOT_FOUND, 'Session introuvable');

    const currentQuestion = session.quiz.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return {
        questionId: null,
        totalParticipants: session.participants.length,
        submissions: [],
      };
    }

    // Get submissions for current question - handle multiple submissions per participant
    const submissions = session.participants
      .map((participant) => {
        // Get ALL submissions for this question by this participant
        const participantSubmissions = participant.answerSubmissions.filter(
          (sub) => sub.questionId === currentQuestion.id,
        );

        // Sort by submittedAt desc and take the most recent
        const latestSubmission = participantSubmissions.sort(
          (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
        )[0];

        return {
          participantId: participant.id,
          displayName: participant.displayName,
          selectedAnswerIds: latestSubmission
            ? (latestSubmission.selectedAnswerIds as string[])
            : [],
          submittedAt: latestSubmission?.submittedAt?.toISOString() || null,
        };
      })
      .filter((sub) => sub.selectedAnswerIds.length > 0);

    return {
      questionId: currentQuestion.id,
      totalParticipants: session.participants.length,
      submissions,
    };
  }

  async getUserSessionHistory(userId: string) {
    // Get sessions where user is a participant
    const participantSessions = await this.prisma.sessionParticipant.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            quiz: {
              select: {
                title: true,
                authorId: true,
              },
            },
            participants: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        session: {
          createdAt: 'desc',
        },
      },
    });

    // Get sessions where user is the quiz author (teacher)
    const authorSessions = await this.prisma.session.findMany({
      where: {
        quiz: {
          authorId: userId,
        },
      },
      include: {
        quiz: {
          select: {
            title: true,
            authorId: true,
          },
        },
        participants: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Merge and deduplicate
    const allSessions = [
      ...participantSessions.map((p) => ({
        ...p.session,
        isAuthor: p.session.quiz.authorId === userId,
      })),
      ...authorSessions.map((s) => ({
        ...s,
        isAuthor: s.quiz.authorId === userId,
      })),
    ];

    // Remove duplicates by session ID
    const uniqueSessions = Array.from(
      new Map(allSessions.map((s) => [s.id, s])).values(),
    );

    // Sort by creation date desc
    uniqueSessions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return uniqueSessions.map((session) => ({
      id: session.id,
      code: session.code,
      state: mapSessionState(session.state),
      quizId: session.quizId,
      quizTitle: session.quiz.title,
      participantCount: session.participants.length,
      createdAt: session.createdAt.toISOString(),
      isAuthor: session.isAuthor,
    }));
  }
}
