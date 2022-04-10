import { Module } from '@nestjs/common';
import { createConnection } from 'typeorm';
import { MessageEntity } from '../repository/message/message.entity';
import { CustomerAgent } from '../repository/customer-agent/customer-agent.entity';
import { UserEntity } from '../repository/user/user.entity';
import { UserJobEntity } from '../repository/user-job/user-job.entity';
import { ConversationEntity } from '../repository/conversation/conversation.entity';
import { CustomerEntity } from '../repository/customer/customer.entity';
import { MessageTemplateEntity } from '../repository/message-template/message-template.entity';

export const DATABASE_CONNECTION = 'database_connection';

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: () =>
        createConnection({
          timezone: process.env.TZ,
          type: 'mysql',
          database: process.env.DB_DATABASE,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          entities: [
            UserEntity,
            CustomerAgent,
            MessageEntity,
            UserJobEntity,
            ConversationEntity,
            CustomerEntity,
            MessageTemplateEntity,
          ],
        }),
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
