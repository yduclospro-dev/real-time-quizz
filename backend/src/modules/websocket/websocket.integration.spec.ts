import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp, cleanupDatabase } from '../../test-utils/test-setup';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { Role } from '@shared/enums/role';
import { QuestionType } from '@shared/enums/question-type';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'MOCK12'),
}));

describe('WebSocket Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teacherSocket: Socket;
  let studentSocket: Socket;
  let teacherCookie: string;
  let studentCookie: string;
  let teacherId: string;
  let studentId: string;
  let quizId: string;
  let sessionId: string;
  let sessionCode: string;
  let httpServer: any;

  const WS_URL = 'http://localhost:3000';

  const extractCookie = (response: any): string => {
    const cookies = response.headers['set-cookie'];
    if (!cookies || cookies.length === 0) return '';
    return cookies[0].split(';')[0];
  };

  const connectSocket = (cookie: string): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const socket = io(WS_URL, {
        extraHeaders: {
          cookie: cookie,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (error) => reject(error));

      setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
    });
  };

  beforeAll(async () => {
    app = await createTestApp({
      imports: [AppModule],
    });
    
    await app.listen(3000);
    httpServer = app.getHttpServer();
    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    // Create and login teacher
    const teacherRegister = await request(httpServer)
      .post('/auth/register')
      .send({
        email: 'teacher@ws.com',
        password: 'password123',
        firstName: 'Teacher',
        lastName: 'WS',
        role: Role.TEACHER,
      });
    teacherId = teacherRegister.body.data.user.id;

    const teacherLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'teacher@ws.com',
        password: 'password123',
      });
    teacherCookie = extractCookie(teacherLogin);

    // Create and login student
    const studentRegister = await request(httpServer)
      .post('/auth/register')
      .send({
        email: 'student@ws.com',
        password: 'password123',
        firstName: 'Student',
        lastName: 'WS',
        role: Role.STUDENT,
      });
    studentId = studentRegister.body.data.user.id;

    const studentLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'student@ws.com',
        password: 'password123',
      });
    studentCookie = extractCookie(studentLogin);

    // Create quiz
    const quizResponse = await request(httpServer)
      .post('/quiz')
      .set('Cookie', teacherCookie)
      .send({
        title: 'WebSocket Test Quiz',
        questions: [
          {
            text: 'Question 1',
            type: QuestionType.SINGLE_CHOICE,
            timeLimit: 10,
            answers: [
              { text: 'A', isCorrect: false },
              { text: 'B', isCorrect: true },
            ],
          },
          {
            text: 'Question 2',
            type: QuestionType.SINGLE_CHOICE,
            timeLimit: 10,
            answers: [
              { text: 'C', isCorrect: true },
              { text: 'D', isCorrect: false },
            ],
          },
        ],
      });
    quizId = quizResponse.body.data.quiz.id;

    // Create session
    const sessionResponse = await request(httpServer)
      .post(`/quiz/${quizId}/start`)
      .set('Cookie', teacherCookie);
    sessionId = sessionResponse.body.data.sessionId;
    sessionCode = sessionResponse.body.data.code;

    // Connect WebSocket clients
    teacherSocket = await connectSocket(teacherCookie);
    studentSocket = await connectSocket(studentCookie);
  });

  afterEach(async () => {
    if (teacherSocket?.connected) teacherSocket.disconnect();
    if (studentSocket?.connected) studentSocket.disconnect();
    await cleanupDatabase(prisma);
  });

  afterAll(async () => {
    try {
      await cleanupDatabase(prisma);
      await prisma.$disconnect();
    } finally {
      await app.close();
    }
  });

  describe('Connection & Join', () => {
    it('should connect and join session', (done) => {
      studentSocket.emit('session:join', {
        sessionId,
        userId: studentId,
      });

      studentSocket.on('session:state', (state: any) => {
        expect(state.id).toBe(sessionId);
        expect(state.code).toBe(sessionCode);
        expect(state.state).toBe('CREATED');
        done();
      });
    });

    it('should notify others when joining', (done) => {
      teacherSocket.emit('session:join', {
        sessionId,
        userId: teacherId,
      });

      teacherSocket.on('participant:joined', (data: any) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.participants).toBeDefined();
        expect(Array.isArray(data.participants)).toBe(true);
        done();
      });

      setTimeout(() => {
        studentSocket.emit('session:join', {
          sessionId,
          userId: studentId,
        });
      }, 100);
    });
  });

  describe('Start Quiz', () => {
    beforeEach((done) => {
      teacherSocket.emit('session:join', {
        sessionId,
        userId: teacherId,
      });

      studentSocket.emit('session:join', {
        sessionId,
        userId: studentId,
      });

      setTimeout(done, 200);
    });

    it('should start quiz and broadcast to all participants', (done) => {
      let receivedCount = 0;

      const checkComplete = () => {
        receivedCount++;
        if (receivedCount === 2) done();
      };

      teacherSocket.on('session:started', (data: any) => {
        expect(data.id).toBe(sessionId);
        expect(data.state).toBe('STARTED');
        checkComplete();
      });

      studentSocket.on('session:started', (data: any) => {
        expect(data.id).toBe(sessionId);
        expect(data.state).toBe('STARTED');
        checkComplete();
      });

      teacherSocket.emit('session:start', {
        sessionId,
        userId: teacherId,
      });
    });
  });

  describe('Submit Answer', () => {
    let questionId: string;
    let correctAnswerId: string;

    beforeEach(async () => {
      // Join session via HTTP to create participant record
      await request(httpServer)
        .post(`/session/join`)
        .set('Cookie', studentCookie)
        .send({ sessionCode: sessionCode });

      // Get question data
      const quizData = await request(httpServer)
        .get(`/quiz/${quizId}`)
        .set('Cookie', teacherCookie);

      questionId = quizData.body.data.questions[0].id;
      correctAnswerId = quizData.body.data.questions[0].answers.find(
        (a: any) => a.isCorrect
      ).id;

      // Join both users via WebSocket
      teacherSocket.emit('session:join', {
        sessionId,
        userId: teacherId,
      });

      studentSocket.emit('session:join', {
        sessionId,
        userId: studentId,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Start session via WebSocket
      teacherSocket.emit('session:start', {
        sessionId,
        userId: teacherId,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    it('should submit answer and receive confirmation', (done) => {
      studentSocket.on('answer:confirmed', (data: any) => {
        expect(data.questionId).toBe(questionId);
        expect(data.isCorrect).toBeDefined();
        done();
      });

      studentSocket.emit('answer:submit', {
        sessionId,
        userId: studentId,
        questionId,
        selectedAnswerIds: [correctAnswerId],
      });
    });

    it('should update question stats after submission', (done) => {
      teacherSocket.on('question:stats', (stats: any) => {
        if (stats.submissions && stats.submissions.length > 0) {
          expect(stats.totalParticipants).toBeGreaterThan(0);
          expect(stats.submissions[0].participantId).toBeDefined();
          done();
        }
      });

      studentSocket.emit('answer:submit', {
        sessionId,
        userId: studentId,
        questionId,
        selectedAnswerIds: [correctAnswerId],
      });
    });
  });

  describe('Advance Question', () => {
    let questionId: string;
    let correctAnswerId: string;

    beforeEach(async () => {
      // Get question data
      const quizData = await request(httpServer)
        .get(`/quiz/${quizId}`)
        .set('Cookie', teacherCookie);

      questionId = quizData.body.data.questions[0].id;
      correctAnswerId = quizData.body.data.questions[0].answers.find(
        (a: any) => a.isCorrect
      ).id;

      // Join via WebSocket
      teacherSocket.emit('session:join', {
        sessionId,
        userId: teacherId,
      });

      studentSocket.emit('session:join', {
        sessionId,
        userId: studentId,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Start via WebSocket
      teacherSocket.emit('session:start', {
        sessionId,
        userId: teacherId,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Submit answer via WebSocket
      studentSocket.emit('answer:submit', {
        sessionId,
        userId: studentId,
        questionId,
        selectedAnswerIds: [correctAnswerId],
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    it('should advance to next question', (done) => {
      let receivedCount = 0;

      const checkComplete = () => {
        receivedCount++;
        if (receivedCount === 2) done();
      };

      teacherSocket.on('question:advanced', (data: any) => {
        expect(data.currentQuestionIndex).toBe(1);
        checkComplete();
      });

      studentSocket.on('question:advanced', (data: any) => {
        expect(data.currentQuestionIndex).toBe(1);
        checkComplete();
      });

      teacherSocket.emit('question:advance', {
        sessionId,
        userId: teacherId,
        nextQuestionIndex: 1,
        timeLimitSeconds: 10,
      });
    });
  });

  describe('Finish Session', () => {
    beforeEach(async () => {
      teacherSocket.emit('session:join', {
        sessionId,
        userId: teacherId,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      await request(httpServer)
        .post(`/session/${sessionId}/start`)
        .set('Cookie', teacherCookie);
    });

    it('should finish session and broadcast to all', (done) => {
      teacherSocket.on('session:finished', (data: any) => {
        expect(data.id).toBe(sessionId);
        expect(data.state).toBe('FINISHED');
        done();
      });

      teacherSocket.emit('session:finish', {
        sessionId,
        userId: teacherId,
      });
    });
  });

  describe('Disconnect Handling', () => {
    it('should notify when participant disconnects', (done) => {
      teacherSocket.emit('session:join', {
        sessionId,
        userId: teacherId,
      });

      studentSocket.emit('session:join', {
        sessionId,
        userId: studentId,
      });

      const studentSocketId = studentSocket.id!;

      teacherSocket.on('participant:disconnected', (data: any) => {
        expect(data.socketId).toBe(studentSocketId);
        done();
      });

      setTimeout(() => {
        studentSocket.disconnect();
      }, 200);
    });
  });
});
