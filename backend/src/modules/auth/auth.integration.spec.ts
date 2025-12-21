import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp, cleanupDatabase, extractCookie } from '../../test-utils/test-setup';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'MOCK12'),
}));
import { Role } from '@shared/enums/role';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp({
      imports: [AppModule],
    });
    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
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

  describe('POST /auth/register', () => {
    it('should register a new teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'teacher@test.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: Role.TEACHER,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.TEACHER,
      });
      expect(response.body.data.user.id).toBeDefined();
    });

    it('should register a new student', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'student@test.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
          role: Role.STUDENT,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(Role.STUDENT);
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: Role.STUDENT,
      };

      await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: Role.STUDENT,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
          role: Role.STUDENT,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'login@test.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'Test',
        role: Role.TEACHER,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@test.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    let authCookie: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'me@test.com',
        password: 'password123',
        firstName: 'Me',
        lastName: 'Test',
        role: Role.TEACHER,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'me@test.com',
          password: 'password123',
        });

      authCookie = loginResponse.headers['set-cookie'][0];
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@test.com');
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let authCookie: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'logout@test.com',
        password: 'password123',
        firstName: 'Logout',
        lastName: 'Test',
        role: Role.STUDENT,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logout@test.com',
          password: 'password123',
        });

      authCookie = loginResponse.headers['set-cookie'][0];
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
