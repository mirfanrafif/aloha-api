import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { UserJobModule } from './job/user-job.module';
import { MessageModule } from './messages/message.module';
import { MessageTemplateRepoModule } from './core/repository/message-template/message-template.module';
import { MessageTemplateModule } from './template/message-template.module';
import { BroadcastMessageModule } from './broadcast/broadcast.module';
import { UserManageModule } from './user-manage/user-manage.module';
@Module({
  imports: [
    BroadcastMessageModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CustomerModule,
    UserJobModule,
    MessageModule,
    MessageTemplateRepoModule,
    MessageTemplateModule,
    UserModule,
    UserManageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
