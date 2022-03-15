import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { Connection } from 'typeorm';
import { CustomerEntity } from './customer.entity';

export const CUSTOMER_REPOSITORY = 'customer_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: CUSTOMER_REPOSITORY,
      inject: [DATABASE_CONNECTION],
      useFactory: (connection: Connection) =>
        connection.getRepository(CustomerEntity),
    },
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomerRepositoryModule {}
