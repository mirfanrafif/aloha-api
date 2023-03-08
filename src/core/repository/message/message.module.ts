import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from '../../database/database.module';
import { Connection } from 'typeorm';
import { MessageEntity } from './message.entity';

export const MESSAGE_REPOSITORY = 'message_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: MESSAGE_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(MessageEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [MESSAGE_REPOSITORY],
})
export class MessageRepositoryModule {}
