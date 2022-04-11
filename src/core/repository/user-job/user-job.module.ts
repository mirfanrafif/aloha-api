import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { Connection } from 'typeorm';
import { UserJobEntity } from './user-job.entity';

export const USER_JOB_REPOSITORY = 'user_job_repository';

@Module({
  providers: [
    {
      provide: USER_JOB_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(UserJobEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  imports: [DatabaseModule],
  exports: [USER_JOB_REPOSITORY],
})
export class UserJobRepositoryModule {}
