import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { HttpModule } from '@nestjs/axios';
import { MessageRepositoryModule } from 'src/core/repository/message/message.module';
import { CustomerModule } from 'src/customer/customer.module';
import { ConversationRepositoryModule } from 'src/core/repository/conversation/conversation-repository.module';
import { ConversationService } from './conversation.service';
import { UserJobModule } from 'src/job/user-job.module';
import { UserModule } from 'src/user/user.module';
import { MessageTemplateModule } from 'src/core/repository/message-template/message-template.module';
import { MessageTemplateController } from './template/message-template.controller';
import { MessageTemplateService } from './template/message-template.service';
import { MessageBroadcastController } from './broadcast/broadcast-message.controller';
import { BroadcastMessageService } from './broadcast/broadcast-message.service';
import { WablasService } from './wablas.service';

@Module({
  providers: [
    MessageService,
    MessageGateway,
    ConversationService,
    MessageTemplateService,
    BroadcastMessageService,
    WablasService,
  ],
  controllers: [
    MessageController,
    MessageTemplateController,
    MessageBroadcastController,
  ],
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
    MessageTemplateModule,
  ],
})
export class MessageModule {}
