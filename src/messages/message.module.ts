import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { MessageService } from './services/message.service';
import { MessageController } from './message.controller';
import { HttpModule } from '@nestjs/axios';
import { MessageRepositoryModule } from 'src/core/repository/message/message.module';
import { CustomerModule } from 'src/customer/customer.module';
import { ConversationRepositoryModule } from 'src/core/repository/conversation/conversation-repository.module';
import { ConversationService } from './services/conversation.service';
import { UserJobModule } from 'src/job/user-job.module';
import { UserModule } from 'src/user/user.module';
import { MessageBroadcastController } from '../broadcast/broadcast-message.controller';
import { BroadcastMessageService } from 'src/broadcast/broadcast-message.service';
import { WablasService } from '../core/wablas/wablas.service';
import { MessageHelper } from './helper/message.helper';

@Module({
  providers: [
    MessageService,
    MessageGateway,
    ConversationService,
    BroadcastMessageService,
    WablasService,
    MessageHelper,
  ],
  controllers: [MessageController, MessageBroadcastController],
  imports: [
    HttpModule.register({
      withCredentials: true,
      baseURL: 'https://solo.wablas.com',
    }),
    MessageRepositoryModule,
    CustomerModule,
    UserModule,
    ConversationRepositoryModule,
    UserJobModule,
  ],
})
export class MessageModule {}
