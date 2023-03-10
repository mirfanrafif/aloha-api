import { Module } from '@nestjs/common';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfileController } from './profile/user-profile.controller';
import { UserProfileService } from './profile/user-profile.service';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';

@Module({
  imports: [
    UserRepositoryModule,
    CustomerRepositoryModule,
    CustomerAgentRepositoryModule,
    UserJobRepositoryModule,
  ],
  controllers: [UserController, UserProfileController],
  providers: [UserService, UserProfileService],
  exports: [UserService],
})
export class UserModule {}
