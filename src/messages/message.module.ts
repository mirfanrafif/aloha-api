import { Module } from '@nestjs/common';
import { ChatGateway } from './message.gateway';
import { ChatService } from './message.service';
import { MessageController } from './message.controller';
import { HttpModule } from '@nestjs/axios';
import { MessageRepositoryModule } from 'src/core/repository/chat/chat.module';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  providers: [ChatService, ChatGateway],
  controllers: [MessageController],
  imports: [
    HttpModule.register({
      baseURL: 'https://sambi.wablas.com',
    }),
    MessageRepositoryModule,
    CustomerModule,
  ],
})
export class MessageModule {}
