import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
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

  sendMessage(data) {
    this.server.emit('chat', data);
  }

  @WebSocketServer()
  server: Server;
}
