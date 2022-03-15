import { Module } from '@nestjs/common';
import { MessageModule } from 'src/messages/message.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    UserRepositoryModule,
    CustomerModule,
    MessageModule,
    UserJobRepositoryModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
