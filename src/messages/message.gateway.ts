import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessageEntity } from 'src/core/repository/chat/message.entity';
import { MessageResponse } from './message.dto';
@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  namespace: 'chats',
})
export class ChatGateway {
  sendMessage(data: MessageEntity) {
    this.server.emit('chat', data);
  }

  @WebSocketServer()
  server: Server;
}
