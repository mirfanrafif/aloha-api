import { Module } from '@nestjs/common';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfileController } from './profile/user-profile.controller';
import { UserManageController } from './manage/manage-user.controller';
import { UserProfileService } from './profile/user-profile.service';
import { ManageUserService } from './manage/manage-user.service';

@Module({
  imports: [UserRepositoryModule, CustomerModule],
  controllers: [UserController, UserProfileController, UserManageController],
  providers: [UserService, UserProfileService, ManageUserService],
  exports: [UserService],
})
export class UserModule {}
