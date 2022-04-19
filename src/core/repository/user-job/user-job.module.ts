import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { DataSource } from 'typeorm';
import { UserJobEntity } from './user-job.entity';

export const USER_JOB_REPOSITORY = 'user_job_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: USER_JOB_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(UserJobEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [
    {
      provide: USER_JOB_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(UserJobEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
})
export class UserJobRepositoryModule {}
