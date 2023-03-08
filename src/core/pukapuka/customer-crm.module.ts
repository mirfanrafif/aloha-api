import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationRepositoryModule } from '../repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from '../repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from '../repository/customer/customer.module';
import { UserRepositoryModule } from '../repository/user/user.module';
import { CustomerCrmService } from './customer-crm.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          baseURL: configService.get('CRM_URL'),
        };
      },
      inject: [ConfigService],
    }),
    CustomerRepositoryModule,
    UserRepositoryModule,
    CustomerAgentRepositoryModule,
    ConversationRepositoryModule,
  ],
  providers: [CustomerCrmService],
  exports: [CustomerCrmService],
})
export class CustomerCrmModule {}
