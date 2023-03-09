import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserJwtPayload } from '../../auth/auth.dto';
import { CustomerService } from '../../customer/customer.service';
import { UserService } from '../../user/user.service';
import { MessageResponseDto } from '../message.dto';
@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  namespace: 'messages',
})
@UseInterceptors(ClassSerializerInterceptor)
export class MessageGateway {
  constructor(
    private userService: UserService,
    private customerService: CustomerService,
  ) {}

  async sendMessage({ data }: { data: MessageResponseDto }) {
    const customer = data.customer;
    const agents = await this.customerService.findAgentByCustomer({
      customer: customer,
    });
    const agentIds = agents
      .filter((item) => item.agent !== null)
      .map((item) => item.agent.id.toString());

    agentIds.push('admin');

    agentIds.forEach((item) => {
      this.server.to(`message:${item}`).emit('message', JSON.stringify(data));
    });
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

    socket.join('message:' + user.id);
    return 'Agent ' + user.full_name + ' joined the message';
  }

  @WebSocketServer()
  server: Server;
}
