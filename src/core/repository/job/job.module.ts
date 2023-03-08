import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from '../../database/database.module';
import { Connection } from 'typeorm';
import { JobEntity } from './job.entity';

export const JOB_REPOSITORY = 'job_repository';

@Module({
  providers: [
    {
      provide: JOB_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(JobEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  imports: [DatabaseModule],
  exports: [JOB_REPOSITORY],
})
export class JobRepositoryModule {}
