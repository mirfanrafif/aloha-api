import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  imports: [
    HttpModule.register({
      baseURL: 'http://anggapajainiurlcustomer.com',
    }),
    CustomerAgentRepositoryModule,
    UserRepositoryModule,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
