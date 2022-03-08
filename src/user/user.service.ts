import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
  ) {}

  getCurrentUser() {
    return this.userRepository.find();
  }

  async getCustomerBySalesId(id: number) {
    const user = await this.userRepository.findOne(id, {
      relations: ['customer'],
    });
    console.log(user);
    const result: ApiResponse<any> = {
      success: true,
      data: user.customer,
      message: `Success getting customer list by sales id ${id}`,
    };
    return result;
  }
}
