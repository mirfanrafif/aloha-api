import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { Connection } from 'typeorm';
import { MessageTemplateEntity } from './message-template.entity';

export const MESSAGE_TEMPLATE_REPOSITORY = 'message_template_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: MESSAGE_TEMPLATE_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(MessageTemplateEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [MESSAGE_TEMPLATE_REPOSITORY],
})
export class MessageTemplateRepoModule {}
