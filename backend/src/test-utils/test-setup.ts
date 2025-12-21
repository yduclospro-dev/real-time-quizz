import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { ApiException } from '../common/exceptions/api.exception';
import { ErrorCode } from '../common/errors/error-codes';

export async function createTestApp(moduleMetadata: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule(moduleMetadata).compile();

  const app = moduleFixture.createNestApplication();

  // Apply same middleware as main app
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const details = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {})[0] || 'Validation error',
        }));
        return new ApiException(400, ErrorCode.VALIDATION_ERROR, 'La validation a échoué', details);
      },
    }),
  );

  await app.init();
  return app;
}

export async function cleanupDatabase(prisma: PrismaService) {
  // Delete in correct order to respect foreign key constraints
  await prisma.answerSubmission.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.session.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany(); // Must delete quiz before user (FK: Quiz.authorId -> User.id)
  await prisma.user.deleteMany();
}
/**
 * Extract cookie from supertest response headers
 * Returns first cookie or empty string if none found
 */
export function extractCookie(response: any): string {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) return '';
  return Array.isArray(setCookie) ? setCookie[0] : setCookie;
}