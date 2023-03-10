import { Module } from '@nestjs/common';
import { UserRepositoryModule } from '../core/repository/user/user.module';
import { CustomerModule } from '../customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfileController } from './profile/user-profile.controller';
import { UserProfileService } from './profile/user-profile.service';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';

@Module({
  imports: [
    UserRepositoryModule,
    CustomerModule,
    CustomerAgentRepositoryModule,
    UserJobRepositoryModule,
  ],
  controllers: [UserController, UserProfileController],
  providers: [UserService, UserProfileService],
  exports: [UserService],
})
export class UserModule {}
