import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from '../../../core/database/database.module';
import { Connection } from 'typeorm';
import { ConversationEntity } from './conversation.entity';

export const CONVERSATION_REPOSITORY = 'conversation_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: CONVERSATION_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(ConversationEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [CONVERSATION_REPOSITORY],
})
export class ConversationRepositoryModule {}
