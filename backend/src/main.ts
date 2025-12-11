import 'dotenv/config';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
        const formattedErrors = errors.map((error) => {
          // Si c'est une propriété non autorisée
          if (error.constraints?.whitelistValidation) {
            return {
              field: error.property,
              message: `Le champ '${error.property}' n'est pas autorisé`,
            };
          }
          // Sinon, prendre le premier message de validation
          return {
            field: error.property,
            message: Object.values(error.constraints || {})[0],
          };
        });
        return new BadRequestException({
          statusCode: 400,
          message: 'La validation a échoué',
          errors: formattedErrors,
        });
      },
    }),
  );

  await app.listen(3000);
  console.log(`🚀 Backend running on: http://localhost:3000`);
}

void bootstrap();
