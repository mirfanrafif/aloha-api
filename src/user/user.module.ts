import { Module } from '@nestjs/common';
import { MessageModule } from 'src/messages/message.module';
import { MessageRepositoryModule } from 'src/core/repository/chat/chat.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    UserRepositoryModule,
    CustomerModule,
    MessageModule,
    MessageRepositoryModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
