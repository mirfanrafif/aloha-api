import { Module } from '@nestjs/common';
import { createConnection } from 'typeorm';
import { MessageEntity } from '../repository/chat/message.entity';
import { CustomerSales } from '../repository/customer-sales/customer-sales.entity';
import { UserEntity } from '../repository/user/user.entity';

export const DATABASE_CONNECTION = 'database_connection';

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: () =>
        createConnection({
          type: 'mysql',
          database: process.env.DB_DATABASE,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          entities: [UserEntity, MessageEntity, CustomerSales],
          synchronize: true,
        }),
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
