import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { HttpModule } from '@nestjs/axios';
import { ChatRepositoryModule } from 'src/core/repository/chat/chat.module';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  imports: [
    HttpModule.register({
      baseURL: 'https://sambi.wablas.com',
    }),
    ChatRepositoryModule,
    CustomerModule,
  ],
})
export class ChatModule {}
