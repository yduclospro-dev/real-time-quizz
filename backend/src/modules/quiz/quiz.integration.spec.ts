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

describe('Quiz Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teacherCookie: string;
  let teacherId: string;
  let studentCookie: string;

  beforeAll(async () => {
    app = await createTestApp({
      imports: [AppModule],
    });
    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    // Create and login teacher
    const teacherRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'teacher@quiz.com',
        password: 'password123',
        firstName: 'Teacher',
        lastName: 'Quiz',
        role: Role.TEACHER,
      });
    teacherId = teacherRegister.body.data.user.id;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'teacher@quiz.com',
        password: 'password123',
      });
    teacherCookie = extractCookie(teacherLogin);

    // Create and login student
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'student@quiz.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Quiz',
      role: Role.STUDENT,
    });

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'student@quiz.com',
        password: 'password123',
      });
    studentCookie = extractCookie(studentLogin);
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

  describe('POST /quiz', () => {
    const validQuiz = {
      title: 'Geography Quiz',
      questions: [
        {
          text: 'What is the capital of France?',
          type: QuestionType.SINGLE_CHOICE,
          timeLimit: 30,
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'London', isCorrect: false },
            { text: 'Berlin', isCorrect: false },
          ],
        },
      ],
    };

    it('should create a quiz as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send(validQuiz)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quiz.title).toBe('Geography Quiz');
      expect(response.body.data.quiz.questions).toHaveLength(1);
      expect(response.body.data.quiz.questions[0].answers).toHaveLength(3);
    });

    it('should fail to create quiz as student', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', studentCookie)
        .send(validQuiz)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should fail with empty title', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: '',
          questions: validQuiz.questions,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with no questions', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'Empty Quiz',
          questions: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with less than 2 answers', async () => {
      const response = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'Invalid Quiz',
          questions: [
            {
              text: 'Question?',
              type: QuestionType.SINGLE_CHOICE,
              answers: [{ text: 'Only one', isCorrect: true }],
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /quiz', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'Quiz 1',
          questions: [
            {
              text: 'Question 1',
              type: QuestionType.SINGLE_CHOICE,
              answers: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
              ],
            },
          ],
        });
    });

    it('should get all quizzes', async () => {
      const response = await request(app.getHttpServer())
        .get('/quiz')
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quizzes).toHaveLength(1);
      expect(response.body.data.quizzes[0].title).toBe('Quiz 1');
    });
  });

  describe('GET /quiz/:id', () => {
    let quizId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'Detailed Quiz',
          questions: [
            {
              text: 'Question 1',
              type: QuestionType.MULTIPLE_CHOICE,
              timeLimit: 45,
              answers: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: true },
                { text: 'C', isCorrect: false },
              ],
            },
          ],
        });
      quizId = createResponse.body.data.quiz.id;
    });

    it('should get quiz by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/quiz/${quizId}`)
        .set('Cookie', teacherCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Detailed Quiz');
      expect(response.body.data.questions[0].timeLimit).toBe(45);
    });

    it('should fail with invalid id', async () => {
      await request(app.getHttpServer())
        .get('/quiz/invalid-id')
        .set('Cookie', teacherCookie)
        .expect(404);
    });
  });

  describe('PUT /quiz/:id', () => {
    let quizId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'Original Quiz',
          questions: [
            {
              text: 'Original Question',
              type: QuestionType.SINGLE_CHOICE,
              answers: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
              ],
            },
          ],
        });
      quizId = createResponse.body.data.quiz.id;
    });

    it('should update quiz as teacher', async () => {
      const response = await request(app.getHttpServer())
        .put(`/quiz/${quizId}`)
        .set('Cookie', teacherCookie)
        .send({
          title: 'Updated Quiz',
          questions: [
            {
              text: 'Updated Question',
              type: QuestionType.SINGLE_CHOICE,
              answers: [
                { text: 'X', isCorrect: true },
                { text: 'Y', isCorrect: false },
              ],
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Quiz');
    });

    it('should fail to update as student', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .put(`/quiz/${fakeUuid}`)
        .set('Cookie', studentCookie)
        .send({
          title: 'Hacked',
          questions: [
            {
              text: 'Question?',
              type: QuestionType.SINGLE_CHOICE,
              timeLimit: 30,
              answers: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
              ],
            },
          ],
        })
        .expect(403);
    });
  });

  describe('DELETE /quiz/:id', () => {
    let quizId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'To Delete',
          questions: [
            {
              text: 'Question',
              type: QuestionType.SINGLE_CHOICE,
              answers: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
              ],
            },
          ],
        });
      quizId = createResponse.body.data.quiz.id;
    });

    it('should delete quiz as teacher', async () => {
      await request(app.getHttpServer())
        .delete(`/quiz/${quizId}`)
        .set('Cookie', teacherCookie)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/quiz/${quizId}`)
        .set('Cookie', teacherCookie)
        .expect(404);
    });

    it('should fail to delete as student', async () => {
      await request(app.getHttpServer())
        .delete(`/quiz/${quizId}`)
        .set('Cookie', studentCookie)
        .expect(403);
    });
  });

  describe('POST /quiz/:id/start', () => {
    let quizId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/quiz')
        .set('Cookie', teacherCookie)
        .send({
          title: 'Session Quiz',
          questions: [
            {
              text: 'Question',
              type: QuestionType.SINGLE_CHOICE,
              answers: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
              ],
            },
          ],
        });
      quizId = createResponse.body.data.quiz.id;
    });

    it('should create session as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post(`/quiz/${quizId}/start`)
        .set('Cookie', teacherCookie)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.code).toBeDefined();
      expect(response.body.data.code).toHaveLength(6);
    });

    it('should fail to create session as student', async () => {
      await request(app.getHttpServer())
        .post(`/quiz/${quizId}/start`)
        .set('Cookie', studentCookie)
        .expect(403);
    });
  });
});
