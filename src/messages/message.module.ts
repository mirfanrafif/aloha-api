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
import { Client } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { MessageType } from './message.dto';

export const WHATSAPP_CLIENT = 'whatsapp_client';

@Module({
  providers: [
    MessageService,
    MessageGateway,
    ConversationService,
    MessageTemplateService,
    BroadcastMessageService,
    WablasService,
    {
      provide: WHATSAPP_CLIENT,
      useFactory: (service: MessageService) => {
        const client = new Client({});

        client.once('qr', (qr) => {
          // Generate and scan this code with your phone
          qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
          console.log('Client is ready!');
        });

        client.on('message', async (message) => {
          console.log('hello, ada pesan baru: ' + message.body);
          const contact = await message.getContact();
          service.handleIncomingMessage({
            id: message.id.id,
            file: '',
            isGroup: false,
            message: message.body,
            phone: message.from,
            group: {
              desc: '',
              owner: '',
              subject: '',
            },
            messageType: MessageType.text,
            mimeType: '',
            pushName: contact.pushname,
            sender: 1,
            timestamp: message.timestamp,
          });
        });

        client.initialize();

        return client;
      },
      inject: [MessageService],
    },
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
