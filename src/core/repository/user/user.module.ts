import { Module } from '@nestjs/common';
import {
  DatabaseModule,
  DATABASE_CONNECTION,
} from 'src/core/database/database.module';
import { Connection } from 'typeorm';
import { UserEntity } from './user.entity';

export const USER_REPOSITORY = 'user_repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: USER_REPOSITORY,
      useFactory: (connection: Connection) =>
        connection.getRepository(UserEntity),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserRepositoryModule {}
