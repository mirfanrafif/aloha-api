import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserJwtPayload } from 'src/auth/auth.dto';
import { UserService } from 'src/user/user.service';
import { MessageResponseDto } from './message.dto';
@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  namespace: 'messages',
})
@UseInterceptors(ClassSerializerInterceptor)
export class MessageGateway {
  constructor(private userService: UserService) {}

  sendMessage({ data }: { data: MessageResponseDto }) {
    this.server
      .to(`message:${data.customer.id}`)
      .to('message:admin')
      .emit('message', JSON.stringify(data));
  }

  @SubscribeMessage('join')
  async handleUserJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: string,
  ) {
    const payload: UserJwtPayload = JSON.parse(data);
    const user = await this.userService.findUser(payload.id);
    if (user === null) {
      return 'User not found';
    }

    if (user.role == 'admin') {
      socket.join('message:admin');
      return 'Admin joined the message';
    }

    const customers = user.customer.map((item) => item.customer);

    customers.forEach((item) => {
      socket.join('message:' + item.id);
    });
    return 'Agent ' + user.full_name + ' joined the message';
  }

  @WebSocketServer()
  server: Server;
}
