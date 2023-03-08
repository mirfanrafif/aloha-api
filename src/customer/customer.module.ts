import { Module } from '@nestjs/common';
import { ConversationRepositoryModule } from '../core/repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from '../core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from '../core/repository/customer/customer.module';
import { UserJobRepositoryModule } from '../core/repository/user-job/user-job.module';
import { UserRepositoryModule } from '../core/repository/user/user.module';
import { CustomerCrmModule } from '../core/pukapuka/customer-crm.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  imports: [
    CustomerCrmModule,
    CustomerAgentRepositoryModule,
    UserRepositoryModule,
    CustomerRepositoryModule,
    ConversationRepositoryModule,
    UserJobRepositoryModule,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
