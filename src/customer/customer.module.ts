import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';
import { MessageRepositoryModule } from 'src/core/repository/message/message.module';
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
    CustomerRepositoryModule,
    MessageRepositoryModule,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
