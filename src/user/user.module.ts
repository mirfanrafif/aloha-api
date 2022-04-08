import { Module } from '@nestjs/common';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfileController } from './user-profile.controller';
import { UserManageController } from './manage-user.controller';

@Module({
  imports: [UserRepositoryModule, CustomerModule],
  controllers: [UserController, UserProfileController, UserManageController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
