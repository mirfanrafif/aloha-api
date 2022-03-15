import { Module } from '@nestjs/common';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { UserJobService } from './user-job.service';

@Module({
  imports: [UserJobRepositoryModule],
  providers: [UserJobService],
  exports: [UserJobService],
})
export class UserJobModule {}
