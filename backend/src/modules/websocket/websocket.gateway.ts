import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { SessionService } from '../session/session.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  },
})
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Map to track which users are in which session rooms
  private userSessions = new Map<string, string>(); // socketId -> sessionId
  
  // Map to track active timers for each session
  private sessionTimers = new Map<string, NodeJS.Timeout>(); // sessionId -> timer
  
  // Map to track pause timers between questions
  private pauseTimers = new Map<string, { endTime: number; timeout: NodeJS.Timeout }>(); // sessionId -> pause info

  constructor(private readonly sessionService: SessionService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const sessionId = this.userSessions.get(client.id);
    if (sessionId) {
      this.userSessions.delete(client.id);
      
      // Notify others in the room
      this.server.to(sessionId).emit('participant:disconnected', {
        socketId: client.id,
      });

      // Check if room is now empty
      const room = this.server.sockets.adapter.rooms.get(sessionId);
      const roomSize = room?.size || 0;
      
      if (roomSize === 0) {
        console.log(`Session ${sessionId} is now empty. Cleaning up timers...`);
        
        // Clear any active timers for this session
        const timer = this.sessionTimers.get(sessionId);
        if (timer) {
          clearInterval(timer);
          this.sessionTimers.delete(sessionId);
          console.log(`Cleared timer for session ${sessionId}`);
        }
        
        // Clear pause timer if any
        const pauseInfo = this.pauseTimers.get(sessionId);
        if (pauseInfo) {
          clearTimeout(pauseInfo.timeout);
          this.pauseTimers.delete(sessionId);
          console.log(`Cleared pause timer for session ${sessionId}`);
        }
        
        // DO NOT auto-finish - teacher might rejoin to continue or restart
        // Session will be finished when teacher completes quiz flow normally
      }
    }
  }

  @SubscribeMessage('session:join')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ) {
    const { sessionId, userId } = data;

    // Join the Socket.IO room for this session
    client.join(sessionId);
    this.userSessions.set(client.id, sessionId);

    // Get current session state (no quiz data - client loads that via REST)
    const sessionState = await this.sessionService.getSessionState(sessionId);

    // Send current state to the joining client
    client.emit('session:state', sessionState);

    // If session is started, send current question stats (answer counts)
    if (sessionState.state === 'STARTED') {
      const stats = await this.sessionService.getCurrentQuestionStats(sessionId);
      client.emit('question:stats', stats);
      
      // Check if we're in a pause between questions
      const pauseInfo = this.pauseTimers.get(sessionId);
      if (pauseInfo) {
        // We're between questions - send pause time left
        const now = Date.now();
        const pauseTimeLeft = Math.max(0, Math.ceil((pauseInfo.endTime - now) / 1000));
        client.emit('pause:state', {
          pauseTimeLeft,
          isBetweenQuestions: true,
        });
        
        // Send full scores (includes current question since it's over)
        const scores = await this.getLiveScores(sessionId, false);
        client.emit('scores:update', {
          scores,
          totalQuestions: sessionState.totalQuestions,
        });
      } else {
        // Active question - send scores excluding current question
        const scores = await this.getLiveScores(sessionId, true);
        client.emit('scores:update', {
          scores,
          totalQuestions: sessionState.totalQuestions,
        });
        
        // Check if user has already submitted answer for current question
        const session = await this.sessionService.getSessionWithSubmissions(sessionId);
        if (session && session.currentQuestionIndex !== null) {
          const currentQuestion = session.quiz.questions[session.currentQuestionIndex];
          const participant = session.participants.find(p => p.userId === userId);
          
          if (participant && currentQuestion) {
            // Find user's latest submission for current question
            const submission = participant.answerSubmissions
              .filter(s => s.questionId === currentQuestion.id)
              .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
            
            if (submission) {
              // User had already answered - restore their selection
              client.emit('answer:restore', {
                questionId: currentQuestion.id,
                selectedAnswerIds: submission.selectedAnswerIds,
              });
            }
          }
        }
      }
    }

    // Notify others in the room
    this.server.to(sessionId).emit('participant:joined', {
      sessionId,
      participants: sessionState.participants,
    });

    console.log(`User ${userId} joined session ${sessionId}`);
  }

  @SubscribeMessage('session:start')
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ) {
    const { sessionId, userId } = data;

    try {
      const session = await this.sessionService.startQuiz(sessionId, userId);

      // Broadcast to all clients in this session
      this.server.to(sessionId).emit('session:started', session);

      // Send initial scoreboard (all participants with score 0)
      const scores = await this.getLiveScores(sessionId);
      const sessionWithQuiz = await this.sessionService.getSessionWithSubmissions(sessionId);
      const totalQuestions = sessionWithQuiz?.quiz?.questions?.length || 0;
      
      this.server.to(sessionId).emit('scores:update', {
        scores,
        totalQuestions,
      });

      // Start broadcasting timer updates every second
      this.startTimerBroadcast(sessionId);

      console.log(`Session ${sessionId} started by ${userId}`);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('answer:submit')
  async handleAnswerSubmit(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
      userId: string;
      questionId: string;
      selectedAnswerIds: string[];
    },
  ) {
    const { sessionId, userId, questionId, selectedAnswerIds } = data;

    try {
      const result = await this.sessionService.submitAnswer(
        sessionId,
        userId,
        questionId,
        selectedAnswerIds,
      );

      // Confirm submission to the submitter
      client.emit('answer:confirmed', { questionId, isCorrect: result.isCorrect });

      // Broadcast to teacher for real-time stats
      const stats = await this.sessionService.getCurrentQuestionStats(sessionId);
      this.server.to(sessionId).emit('question:stats', stats);

      console.log(`User ${userId} submitted answer for question ${questionId}`);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('question:advance')
  async handleAdvanceQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
      userId: string;
      nextQuestionIndex?: number;
      timeLimitSeconds?: number;
    },
  ) {
    const { sessionId, userId, nextQuestionIndex, timeLimitSeconds } = data;

    try {
      const result = await this.sessionService.advanceQuestion(
        sessionId,
        userId,
        nextQuestionIndex,
        timeLimitSeconds,
      );

      // Get full question data to send with event
      const session = await this.sessionService.getSessionWithSubmissions(sessionId);
      const currentQuestion = session?.quiz?.questions?.[result.currentQuestionIndex];

      // Broadcast to all clients in this session with FULL question data
      this.server.to(sessionId).emit('question:advanced', {
        currentQuestionIndex: result.currentQuestionIndex,
        currentQuestionEndsAt: result.currentQuestionEndsAt,
        question: currentQuestion ? {
          id: currentQuestion.id,
          text: currentQuestion.text,
          image: currentQuestion.image,
          type: currentQuestion.type,
          timeLimit: currentQuestion.timeLimit,
          answers: currentQuestion.answers.map(a => ({
            id: a.id,
            text: a.text,
            isCorrect: a.isCorrect,
          })),
        } : null,
      });

      // Restart timer broadcast for new question
      this.startTimerBroadcast(sessionId);

      console.log(`Session ${sessionId} advanced to question ${result.currentQuestionIndex}`);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('session:finish')
  async handleFinishSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ) {
    const { sessionId, userId } = data;

    try {
      const session = await this.sessionService.finishSession(sessionId, userId);

      // Stop timer
      this.stopTimerBroadcast(sessionId);

      // Broadcast to all clients (no results - they fetch via REST)
      this.server.to(sessionId).emit('session:finished', session);

      console.log(`Session ${sessionId} finished by ${userId}`);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  // Timer broadcast logic
  private startTimerBroadcast(sessionId: string) {
    // Clear existing timer if any
    this.stopTimerBroadcast(sessionId);

    // Broadcast timer every second
    const timer = setInterval(async () => {
      try {
        const session = await this.sessionService.getSessionState(sessionId);
        
        if (session.currentQuestionEndsAt && session.state === 'STARTED') {
          const endsAt = new Date(session.currentQuestionEndsAt).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));

          // Broadcast timer update
          this.server.to(sessionId).emit('timer:update', {
            timeLeft: remaining,
            currentQuestionIndex: session.currentSessionIndex,
          });

          // If timer expired, emit ONCE and stop broadcasting
          if (remaining === 0) {
            console.log(`Timer expired for session ${sessionId}`);
            this.server.to(sessionId).emit('timer:expired', {
              currentQuestionIndex: session.currentSessionIndex,
            });
            
            // Calculate and broadcast scores to ALL clients
            const scores = await this.getLiveScores(sessionId);
            const sessionWithQuiz = await this.sessionService.getSessionWithSubmissions(sessionId);
            const totalQuestions = sessionWithQuiz?.quiz?.questions?.length || 0;
            
            this.server.to(sessionId).emit('scores:update', {
              scores,
              totalQuestions,
            });
            
            // STOP the timer to prevent infinite loop
            this.stopTimerBroadcast(sessionId);
            
            // Broadcast that we're entering pause state
            this.server.to(sessionId).emit('pause:start', { pauseDuration: 10 });
            
            // Track pause state for rejoining users
            const pauseEndTime = Date.now() + 10000;
            const pauseTimeout = setTimeout(async () => {
              try {
                const currentSession = await this.sessionService.getSessionWithSubmissions(sessionId);
                if (!currentSession || currentSession.state !== 'STARTED') return;
                
                const currentIdx = currentSession.currentQuestionIndex;
                const totalQs = currentSession.quiz.questions.length;
                
                if (currentIdx < totalQs - 1) {
                  // Advance to next question
                  const nextIndex = currentIdx + 1;
                  const nextQuestion = currentSession.quiz.questions[nextIndex];
                  
                  const result = await this.sessionService.advanceQuestion(
                    sessionId,
                    currentSession.quiz.authorId, // Use quiz author as the one advancing
                    nextIndex,
                    nextQuestion.timeLimit || 30,
                  );
                  
                  this.server.to(sessionId).emit('question:advanced', {
                    currentQuestionIndex: result.currentQuestionIndex,
                    currentQuestionEndsAt: result.currentQuestionEndsAt,
                    question: {
                      id: nextQuestion.id,
                      text: nextQuestion.text,
                      image: nextQuestion.image,
                      type: nextQuestion.type,
                      timeLimit: nextQuestion.timeLimit,
                      answers: nextQuestion.answers.map(a => ({
                        id: a.id,
                        text: a.text,
                        isCorrect: a.isCorrect,
                      })),
                    },
                  });
                  
                  this.startTimerBroadcast(sessionId);
                  console.log(`Session ${sessionId} auto-advanced to question ${nextIndex}`);
                } else {
                  // Last question - finish session
                  const finishedSession = await this.sessionService.finishSession(
                    sessionId,
                    currentSession.quiz.authorId,
                  );
                  
                  this.stopTimerBroadcast(sessionId);
                  this.server.to(sessionId).emit('session:finished', finishedSession);
                  console.log(`Session ${sessionId} auto-finished`);
                }
              } catch (error) {
                console.error(`Error auto-advancing session ${sessionId}:`, error);
              }
            }, 10000); // 10 second pause
            
            // Store pause info so rejoining users can see it
            this.pauseTimers.set(sessionId, { endTime: pauseEndTime, timeout: pauseTimeout });
          }
        } else {
          // Session not in active state, stop timer
          this.stopTimerBroadcast(sessionId);
        }
      } catch (error) {
        console.error(`Error broadcasting timer for session ${sessionId}:`, error);
        this.stopTimerBroadcast(sessionId);
      }
    }, 1000);

    this.sessionTimers.set(sessionId, timer);
  }

  private stopTimerBroadcast(sessionId: string) {
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.sessionTimers.delete(sessionId);
    }
  }

  // Helper method for server-side events (like timer expiry)
  async broadcastSessionState(sessionId: string) {
    const sessionState = await this.sessionService.getSessionState(sessionId);
    this.server.to(sessionId).emit('session:state', sessionState);
  }
  
  // Calculate live scores during active session
  private async getLiveScores(sessionId: string, excludeCurrentQuestion = false) {
    const session = await this.sessionService.getSessionWithSubmissions(sessionId);
    
    if (!session) return [];
    
    // Get current question ID to exclude if needed
    const currentQuestionId = excludeCurrentQuestion && session.currentQuestionIndex !== null
      ? session.quiz.questions[session.currentQuestionIndex]?.id
      : null;
    
    // Return scores for ALL participants, even if they have no submissions
    const scores = session.participants.map(participant => {
      let score = 0;
      
      // Group submissions by questionId and get LATEST for each question
      const questionMap = new Map<string, any>();
      participant.answerSubmissions.forEach(submission => {
        // Skip current question if excluding
        if (currentQuestionId && submission.questionId === currentQuestionId) return;
        
        const existing = questionMap.get(submission.questionId);
        if (!existing || submission.submittedAt > existing.submittedAt) {
          questionMap.set(submission.questionId, submission);
        }
      });
      
      // Count correct answers from LATEST submissions only
      questionMap.forEach((submission) => {
        const question = session.quiz.questions.find(q => q.id === submission.questionId);
        if (question) {
          const correctAnswerIds = question.answers
            .filter(a => a.isCorrect)
            .map(a => a.id)
            .sort();
          const submittedIds = (submission.selectedAnswerIds as string[]).sort();
          
          const isCorrect =
            correctAnswerIds.length === submittedIds.length &&
            correctAnswerIds.every((id, idx) => id === submittedIds[idx]);
          
          if (isCorrect) score++;
        }
      });
      
      return {
        participantId: participant.id,
        displayName: participant.displayName,
        score,
      };
    });
    
    return scores;
  }
}
