import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationRepositoryModule } from 'src/core/repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
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
    CustomerAgentRepositoryModule,
    UserRepositoryModule,
    CustomerRepositoryModule,
    ConversationRepositoryModule,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
