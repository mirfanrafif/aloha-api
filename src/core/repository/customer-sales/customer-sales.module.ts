import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { Connection } from 'typeorm';
import { CustomerSales } from './customer-sales.entity';

export const CUSTOMER_SALES_REPOSITORY = 'customer_sales_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: CUSTOMER_SALES_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(CustomerSales),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [CUSTOMER_SALES_REPOSITORY],
})
export class CustomerSalesRepositoryModule {}
