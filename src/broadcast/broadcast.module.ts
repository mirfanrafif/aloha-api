import { Module } from '@nestjs/common';
import { WablasModule } from '../core/wablas/wablas.module';
import { CustomerCrmModule } from '../core/pukapuka/customer-crm.module';
import { MessageBroadcastController } from './broadcast-message.controller';
import { BroadcastMessageService } from './broadcast-message.service';
import { CustomerModule } from '../customer/customer.module';
import { MessageGateway } from '../messages/gateways/message.gateway';
import { MessageRepositoryModule } from '../core/repository/message/message.module';
import { MessageHelper } from '../messages/helper/message.helper';
import { UserModule } from '../user/user.module';

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
