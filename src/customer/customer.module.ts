import { Module } from '@nestjs/common';
import { ConversationRepositoryModule } from 'src/core/repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerCrmModule } from 'src/core/pukapuka/customer-crm.module';
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
