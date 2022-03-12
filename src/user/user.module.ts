import { Module } from '@nestjs/common';
import { MessageModule } from 'src/messages/message.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserJobModule } from 'src/core/repository/user-job/user-job.module';

@Module({
  imports: [UserRepositoryModule, CustomerModule, MessageModule, UserJobModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
