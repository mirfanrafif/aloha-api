import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationRepositoryModule } from 'src/core/repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
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
