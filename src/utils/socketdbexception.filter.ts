import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { Socket } from 'socket.io';

@Catch(EntityNotFoundError, QueryFailedError)
export class SocketDBException extends BaseWsExceptionFilter {
  catch(
    exception: EntityNotFoundError | QueryFailedError,
    host: ArgumentsHost,
  ): void {
    const ws = host.switchToWs();

    console.log()

    ws.getClient<Socket>().emit('join', exception.message);
  }
}
