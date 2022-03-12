import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { UserJobModule } from './core/repository/user-job/user-job.module';
@Module({
  imports: [
    DatabaseModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CustomerModule,
    UserJobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
