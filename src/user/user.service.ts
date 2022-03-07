import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@Inject(USER_REPOSITORY) private user: Repository<User>) {}

  getCurrentUser() {
    return this.user.find;
  }
}
