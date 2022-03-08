import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessageEntity } from 'src/core/repository/chat/chat.entity';
import { MessageResponse } from './chat.dto';
@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  namespace: 'chats',
})
export class ChatGateway {
  @SubscribeMessage('chat')
  handleChat(@MessageBody() data: string) {
    console.log(data);
    this.server.emit('chat', data);
    return data;
  }

  sendMessage(data: MessageEntity) {
    this.server.emit('chat', data);
  }

  @WebSocketServer()
  server: Server;
}
