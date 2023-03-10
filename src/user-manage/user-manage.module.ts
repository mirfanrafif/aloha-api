import { Module } from '@nestjs/common';
import { CustomerAgentRepositoryModule } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerRepositoryModule } from 'src/core/repository/customer/customer.module';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { UserManageController } from './manage-user.controller';
import { ManageUserService } from './manage-user.service';

@Module({
  imports: [
    UserRepositoryModule,
    CustomerAgentRepositoryModule,
    UserJobRepositoryModule,
    CustomerRepositoryModule,
  ],
  controllers: [UserManageController],
  providers: [ManageUserService],
})
export class UserManageModule {}
