import { Module } from '@nestjs/common';
import { MessageModule } from 'src/messages/message.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserRepositoryModule, CustomerModule, MessageModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
