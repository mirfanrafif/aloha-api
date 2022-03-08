import { Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserRepositoryModule, CustomerModule, ChatModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
