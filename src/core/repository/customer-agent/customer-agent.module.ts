import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from '../../database/database.module';
import { Connection } from 'typeorm';
import { CustomerAgent } from './customer-agent.entity';

export const CUSTOMER_AGENT_REPOSITORY = 'customer_agent_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: CUSTOMER_AGENT_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(CustomerAgent),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [CUSTOMER_AGENT_REPOSITORY],
})
export class CustomerAgentRepositoryModule {}
