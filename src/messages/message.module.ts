import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { HttpModule } from '@nestjs/axios';
import { MessageRepositoryModule } from 'src/core/repository/message/message.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';

@Module({
  providers: [MessageService, MessageGateway],
  controllers: [MessageController],
  imports: [
    HttpModule.register({
      withCredentials: true,
      baseURL: 'https://solo.wablas.com',
    }),
    MessageRepositoryModule,
    CustomerModule,
    UserRepositoryModule,
  ],
})
export class MessageModule {}
