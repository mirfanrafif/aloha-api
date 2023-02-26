import { Module } from '@nestjs/common';
import { MessageGateway } from './gateways/message.gateway';
import { MessageService } from './services/message.service';
import { MessageController } from './controller/message.controller';
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
import { WablasModule } from 'src/core/wablas/wablas.module';
import { CustomerCrmModule } from 'src/core/pukapuka/customer-crm.module';

@Module({
  providers: [
    MessageService,
    MessageGateway,
    ConversationService,
    MessageHelper,
  ],
  controllers: [MessageController],
  imports: [
    MessageRepositoryModule,
    CustomerModule,
    UserModule,
    ConversationRepositoryModule,
    UserJobModule,
    WablasModule,
    CustomerCrmModule,
  ],
})
export class MessageModule {}
