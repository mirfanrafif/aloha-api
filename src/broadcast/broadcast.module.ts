import { Module } from '@nestjs/common';
import { WablasModule } from 'src/core/wablas/wablas.module';
import { CustomerCrmModule } from 'src/core/pukapuka/customer-crm.module';
import { MessageBroadcastController } from './broadcast-message.controller';
import { BroadcastMessageService } from './broadcast-message.service';
import { CustomerModule } from 'src/customer/customer.module';
import { MessageGateway } from 'src/messages/gateways/message.gateway';
import { MessageRepositoryModule } from 'src/core/repository/message/message.module';
import { MessageHelper } from 'src/messages/helper/message.helper';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    WablasModule,
    CustomerCrmModule,
    CustomerModule,
    MessageRepositoryModule,
    UserModule,
  ],
  controllers: [MessageBroadcastController],
  providers: [BroadcastMessageService, MessageGateway, MessageHelper],
})
export class BroadcastMessageModule {}
