import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp, cleanupDatabase, extractCookie } from '../../test-utils/test-setup';
import { Role } from '@shared/enums/role';
import { QuestionType } from '@shared/enums/question-type';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'MOCK12'),
}));

describe('Session Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teacherCookie: string;
  let studentCookie: string;
  let quizId: string;
  let sessionId: string;
  let sessionCode: string;

  beforeAll(async () => {
    app = await createTestApp({
      imports: [AppModule],
    });
    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    // Create and login teacher
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'teacher@session.com',
      password: 'password123',
      firstName: 'Teacher',
      lastName: 'Session',
      role: Role.TEACHER,
    });

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'teacher@session.com',
        password: 'password123',
      });
    teacherCookie = extractCookie(teacherLogin);

    // Create and login student
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'student@session.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Session',
      role: Role.STUDENT,
    });

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'student@session.com',
        password: 'password123',
      });
    studentCookie = extractCookie(studentLogin);

    // Create a quiz
    const quizResponse = await request(app.getHttpServer())
      .post('/quiz')
      .set('Cookie', teacherCookie)
      .send({
        title: 'Session Test Quiz',
        questions: [
          {
            text: 'What is 2+2?',
            type: QuestionType.SINGLE_CHOICE,
            timeLimit: 30,
            answers: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
              { text: '5', isCorrect: false },
            ],
          },
          {
            text: 'Select all even numbers',
            type: QuestionType.MULTIPLE_CHOICE,
            timeLimit: 30,
            answers: [
              { text: '2', isCorrect: true },
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
            ],
          },
        ],
      });
    quizId = quizResponse.body.data.quiz.id;

    // Create a session
    const sessionResponse = await request(app.getHttpServer())
      .post(`/quiz/${quizId}/start`)
      .set('Cookie', teacherCookie);
    sessionId = sessionResponse.body.data.sessionId;
    sessionCode = sessionResponse.body.data.code;
  });

  afterEach(async () => {
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

  describe('POST /session/join', () => {
    it('should join session with valid code', async () => {
      const response = await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({
          sessionCode: sessionCode,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.quizId).toBe(quizId);
    });

    it('should fail with invalid code', async () => {
      const response = await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({
          sessionCode: 'ABCD12',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid code format', async () => {
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({
          sessionCode: 'ABC',
        })
        .expect(400);
    });
  });

  describe('GET /session/:id', () => {
    it('should get session details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/session/${sessionId}`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
      expect(response.body.data.code).toBe(sessionCode);
    });

    it('should fail with invalid session id', async () => {
      await request(app.getHttpServer())
        .get('/session/invalid-id')
        .set('Cookie', teacherCookie)
        .expect(404);
    });
  });

  describe('GET /session/history', () => {
    beforeEach(async () => {
      // Student joins session
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({
          sessionCode: sessionCode,
        });
    });

    it('should get teacher session history', async () => {
      const response = await request(app.getHttpServer())
        .get('/session/history')
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].quizTitle).toBe('Session Test Quiz');
      expect(response.body.data[0].isAuthor).toBe(true);
    });

    it('should get student session history', async () => {
      const response = await request(app.getHttpServer())
        .get('/session/history')
        .set('Cookie', studentCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isAuthor).toBe(false);
    });
  });

  describe('GET /session/:id/quiz', () => {
    it('should get quiz for session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/session/${sessionId}/quiz`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Session Test Quiz');
      expect(response.body.data.questions).toHaveLength(2);
    });
  });

  describe('POST /session/:id/submit', () => {
    let questionId: string;
    let correctAnswerId: string;
    let wrongAnswerId: string;

    beforeEach(async () => {
      // Join session
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({ sessionCode });

      // Get quiz to extract question and answer IDs
      const quizResponse = await request(app.getHttpServer())
        .get(`/session/${sessionId}/quiz`)
        .set('Cookie', studentCookie);

      questionId = quizResponse.body.data.questions[0].id;
      const answers = quizResponse.body.data.questions[0].answers;
      correctAnswerId = answers.find((a: any) => a.isCorrect).id;
      wrongAnswerId = answers.find((a: any) => !a.isCorrect).id;
    });

    it('should submit correct answer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/session/${sessionId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          questionId,
          selectedAnswerIds: [correctAnswerId],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should submit wrong answer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/session/${sessionId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          questionId,
          selectedAnswerIds: [wrongAnswerId],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with empty answer', async () => {
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          questionId,
          selectedAnswerIds: [],
        })
        .expect(400);
    });
  });

  describe('POST /session/:id/start', () => {
    it('should start quiz as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post(`/session/${sessionId}/start`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.state).toBe('STARTED');
      expect(response.body.data.currentSessionIndex).toBe(0);
    });

    it('should fail to start as student', async () => {
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({ sessionCode });

      await request(app.getHttpServer())
        .post(`/session/${sessionId}/start`)
        .set('Cookie', studentCookie)
        .expect(403);
    });
  });

  describe('GET /session/:id/state', () => {
    it('should get session state', async () => {
      const response = await request(app.getHttpServer())
        .get(`/session/${sessionId}/state`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
      expect(response.body.data.state).toBeDefined();
    });
  });

  describe('POST /session/:id/advance', () => {
    let questionId: string;

    beforeEach(async () => {
      // Join session as student
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({ sessionCode });

      // Start the session
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/start`)
        .set('Cookie', teacherCookie);

      // Get quiz to extract question ID
      const quizResponse = await request(app.getHttpServer())
        .get(`/session/${sessionId}/quiz`)
        .set('Cookie', studentCookie);
      questionId = quizResponse.body.data.questions[0].id;

      // Submit answer for first question
      const answers = quizResponse.body.data.questions[0].answers;
      const correctAnswerId = answers.find((a: any) => a.isCorrect).id;
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          questionId,
          selectedAnswerIds: [correctAnswerId],
        });
    });

    it('should advance to next question as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post(`/session/${sessionId}/advance`)
        .set('Cookie', teacherCookie)
        .send({
          nextQuestionIndex: 1,
          timeLimitSeconds: 30,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentQuestionIndex).toBe(1);
    });

    it('should fail to advance as student', async () => {
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/advance`)
        .set('Cookie', studentCookie)
        .send({
          nextQuestionIndex: 1,
          timeLimitSeconds: 30,
        })
        .expect(403);
    });
  });

  describe('POST /session/:id/finish', () => {
    beforeEach(async () => {
      // Start session
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/start`)
        .set('Cookie', teacherCookie);
    });

    it('should finish session as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post(`/session/${sessionId}/finish`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.state).toBe('FINISHED');
    });

    it('should fail to finish as student', async () => {
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({ sessionCode });

      await request(app.getHttpServer())
        .post(`/session/${sessionId}/finish`)
        .set('Cookie', studentCookie)
        .expect(403);
    });
  });

  describe('GET /session/:id/results', () => {
    beforeEach(async () => {
      // Join as student
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({ sessionCode });

      // Start session
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/start`)
        .set('Cookie', teacherCookie);

      // Get quiz and submit answer
      const quizResponse = await request(app.getHttpServer())
        .get(`/session/${sessionId}/quiz`)
        .set('Cookie', studentCookie);

      const questionId = quizResponse.body.data.questions[0].id;
      const answers = quizResponse.body.data.questions[0].answers;
      const correctAnswerId = answers.find((a: any) => a.isCorrect).id;

      await request(app.getHttpServer())
        .post(`/session/${sessionId}/submit`)
        .set('Cookie', studentCookie)
        .send({
          questionId,
          selectedAnswerIds: [correctAnswerId],
        });

      // Finish session
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/finish`)
        .set('Cookie', teacherCookie);
    });

    it('should get session results', async () => {
      const response = await request(app.getHttpServer())
        .get(`/session/${sessionId}/results`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
      expect(response.body.data.quizTitle).toBe('Session Test Quiz');
    });
  });

  describe('GET /session/:id/question-stats', () => {
    beforeEach(async () => {
      // Join as student
      await request(app.getHttpServer())
        .post('/session/join')
        .set('Cookie', studentCookie)
        .send({ sessionCode });

      // Start session
      await request(app.getHttpServer())
        .post(`/session/${sessionId}/start`)
        .set('Cookie', teacherCookie);
    });

    it('should get question statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/session/${sessionId}/question-stats`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalParticipants).toBeDefined();
      expect(response.body.data.submissions).toBeDefined();
      expect(Array.isArray(response.body.data.submissions)).toBe(true);
    });
  });
});
