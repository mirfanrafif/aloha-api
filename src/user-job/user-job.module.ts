import { Module } from '@nestjs/common';
import { UserJobRepositoryModule } from 'src/core/repository/user-job/user-job.module';
import { UserRepositoryModule } from 'src/core/repository/user/user.module';
import { UserJobController } from './user-job.controller';
import { UserJobService } from './user-job.service';

@Module({
  imports: [UserJobRepositoryModule, UserRepositoryModule],
  providers: [UserJobService],
  exports: [UserJobService],
  controllers: [UserJobController],
})
export class UserJobModule {}
