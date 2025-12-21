import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ApiException } from './common/exceptions/api.exception';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ErrorCode } from './common/errors/error-codes';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: 'http://localhost:8080',
    credentials: true,
  });

  // Cookie parser middleware
  app.use(cookieParser());

  // Exception Filter global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation Pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const details = flattenValidationErrors(errors);

        return new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'La validation a échoué',
          details,
        );
      },
    }),
  );

  // OpenAPI/Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Real-Time Quiz API')
    .setDescription('API for interactive real-time quiz platform with WebSocket support')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('quizzes', 'Quiz CRUD operations')
    .addTag('questions', 'Question management')
    .addTag('sessions', 'Quiz session management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Serve with Scalar UI
  app.use(
    '/api/docs',
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(3000);
  console.log(`🚀 Backend running on: http://localhost:3000`);
  console.log(`📚 API Documentation: http://localhost:3000/api/docs`);
}

export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): { field: string; message: string }[] {
  const result: { field: string; message: string }[] = [];

  for (const error of errors) {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (isWhitelistError(error)) {
      result.push({
        field: fieldPath,
        message: `Le champ '${fieldPath}' n'est pas autorisé`,
      });
      continue;
    }

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        result.push({
          field: fieldPath,
          message,
        });
      }
    }

    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return result;
}

function isWhitelistError(error: ValidationError): boolean {
  return !!error.constraints?.whitelistValidation;
}

void bootstrap();
