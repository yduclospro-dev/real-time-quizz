import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { QuizModule } from './quiz/quiz.module';
import { QuestionModule } from './question/question.module';
import { SessionModule } from './session/session.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [AuthModule, UserModule, QuizModule, QuestionModule, SessionModule, WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
