import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { Connection } from 'typeorm';
import { MessageEntity } from './chat.entity';

export const CHAT_REPOSITORY = 'chat_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: CHAT_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(MessageEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [CHAT_REPOSITORY],
})
export class ChatRepositoryModule {}
