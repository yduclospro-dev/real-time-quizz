import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { QuestionModule } from './modules/question/question.module';
import { SessionModule } from './modules/session/session.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    QuizModule,
    QuestionModule,
    SessionModule,
    WebsocketModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
