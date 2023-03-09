import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import { ConversationRepositoryModule } from '../repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from '../repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from '../repository/customer/customer.module';
import { UserRepositoryModule } from '../repository/user/user.module';
import { CustomerCrmService } from './customer-crm.service';

describe('Customer CRM Service', () => {
  let service: CustomerCrmService;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
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
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [CustomerCrmService],
    }).compile();

    service = testModule.get<CustomerCrmService>(CustomerCrmService);
  });

  it('Get number should not return undefined', async () => {
    const result = await lastValueFrom(
      service.findWithPhoneNumberList(['6281350001696']),
    );
    expect(result[0].phoneNumber).toEqual('6281350001696');
  });
});
