import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CustomerSalesRepositoryModule } from 'src/core/repository/customer-sales/customer-sales.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerService } from './customer.service';

@Module({
  providers: [CustomerService],
  imports: [
    HttpModule.register({
      baseURL: 'http://anggapajainiurlcustomer.com',
    }),
    CustomerSalesRepositoryModule,
    UserRepositoryModule,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
