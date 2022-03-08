import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessageEntity } from 'src/core/repository/chat/message.entity';
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
