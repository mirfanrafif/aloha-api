import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { HttpModule } from '@nestjs/axios';
import { MessageRepositoryModule } from 'src/core/repository/message/message.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { ConversationRepositoryModule } from 'src/core/repository/conversation/conversation-repository.module';
import { ConversationService } from './conversation.service';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';
import { UserModule } from 'src/user/user.module';
import { UserJobModule } from 'src/user-job/user-job.module';

@Module({
  providers: [MessageService, MessageGateway, ConversationService],
  controllers: [MessageController],
  imports: [
    HttpModule.register({
      withCredentials: true,
      baseURL: 'https://solo.wablas.com',
    }),
    MessageRepositoryModule,
    CustomerModule,
    UserRepositoryModule,
    UserJobRepositoryModule,
    ConversationRepositoryModule,
    CustomerRepositoryModule,
    UserJobModule,
  ],
})
export class MessageModule {}
