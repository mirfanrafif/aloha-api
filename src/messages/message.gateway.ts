import { ParseIntPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageEntity } from 'src/core/repository/chat/message.entity';
@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  namespace: 'chats',
})
export class MessageGateway {
  sendMessage(data: MessageEntity) {
    this.server
      .to('chat:' + data.salesId)
      .to('chat:admin')
      .emit('chat', data);
  }

  @SubscribeMessage('join')
  handleUserJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: string,
  ) {
    const user = JSON.parse(data);
    if (user.role == 'admin') {
      socket.join('chat:admin');
    } else {
      socket.join('chat:' + user.id);
    }
    return 'success';
  }

  @WebSocketServer()
  server: Server;
}
