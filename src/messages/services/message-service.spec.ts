import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import { CustomerCrmModule } from '../../core/pukapuka/customer-crm.module';
import { CustomerCrmService } from '../../core/pukapuka/customer-crm.service';
import { ConversationRepositoryModule } from '../../core/repository/conversation/conversation-repository.module';
import { CustomerAgentRepositoryModule } from '../../core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from '../../core/repository/customer/customer.module';
import { MessageRepositoryModule } from '../../core/repository/message/message.module';
import { Role, UserEntity } from '../../core/repository/user/user.entity';
import { UserRepositoryModule } from '../../core/repository/user/user.module';
import { WablasModule } from '../../core/wablas/wablas.module';
import { CustomerModule } from '../../customer/customer.module';
import { UserJobModule } from '../../job/user-job.module';
import { UserModule } from '../../user/user.module';
import { MessageGateway } from '../gateways/message.gateway';
import { MessageHelper } from '../helper/message.helper';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

describe('Customer CRM Service', () => {
  let service: MessageService;

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
        MessageRepositoryModule,
        CustomerModule,
        UserModule,
        ConversationRepositoryModule,
        UserJobModule,
        WablasModule,
        CustomerCrmModule,
      ],
      providers: [
        MessageService,
        MessageGateway,
        ConversationService,
        MessageHelper,
      ],
    }).compile();

    service = testModule.get<MessageService>(MessageService);
  });

  it('Get number should not return undefined', async () => {
    const mockUser = new UserEntity();
    mockUser.id = 3;
    mockUser.role = Role.admin;
    const result = await lastValueFrom(
      await service.sendBulkMessage({
        agent: mockUser,
        bulkMessageRequest: {
          messages: [
            {
              customerNumber: '6282338819564',
              message: 'test',
            },
          ],
        },
      }),
    );
  });
});
