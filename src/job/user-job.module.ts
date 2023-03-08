import { Module } from '@nestjs/common';
import { JobRepositoryModule } from '../core/repository/job/job.module';
import { UserJobRepositoryModule } from '../core/repository/user-job/user-job.module';
import { UserRepositoryModule } from '../core/repository/user/user.module';
import { UserJobController } from './user-job.controller';
import { UserJobService } from './user-job.service';

@Module({
  imports: [JobRepositoryModule, UserRepositoryModule, UserJobRepositoryModule],
  providers: [UserJobService],
  exports: [UserJobService],
  controllers: [UserJobController],
})
export class UserJobModule {}
