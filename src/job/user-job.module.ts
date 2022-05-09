import { Module } from '@nestjs/common';
import { JobRepositoryModule } from 'src/core/repository/job/job.module';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { UserJobController } from './user-job.controller';
import { UserJobService } from './user-job.service';

@Module({
  imports: [JobRepositoryModule, UserRepositoryModule, UserJobRepositoryModule],
  providers: [UserJobService],
  exports: [UserJobService],
  controllers: [UserJobController],
})
export class UserJobModule {}
