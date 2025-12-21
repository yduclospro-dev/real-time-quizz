import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

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

  // Write to root directory
  const outputPath = path.resolve(__dirname, '../../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI spec generated at: ${outputPath}`);
  await app.close();
}

generateOpenApiSpec();
