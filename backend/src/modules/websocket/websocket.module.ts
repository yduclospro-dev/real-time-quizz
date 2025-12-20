import { Module } from '@nestjs/common';
import { SessionGateway } from './websocket.gateway';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  providers: [SessionGateway],
  exports: [SessionGateway],
})
export class WebsocketModule {}
