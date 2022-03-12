import { Inject, Injectable } from '@nestjs/common';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private customerService: CustomerService,
  ) {}

  async getCurrentUser(id: number): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOneOrFail(id, {
      relations: ['job'],
    });
    return {
      success: true,
      data: user,
      message: 'Success getting profile data with user id ' + id,
    };
  }

  async getCustomerByAgentId(user: UserEntity, lastCustomerId?: number) {
    const messages = await this.customerService.getCustomerByAgent(
      user,
      lastCustomerId,
    );
    const result: ApiResponse<CustomerAgent[]> = {
      success: true,
      data: messages,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  // getUserData(user: UserEntity) {
  //   return {
  //     id: user.id,
  //     full_name: user.full_name,
  //     email: user.email,
  //     role: user.role,
  //     profile_photo_url: user.profile_photo_url,
  //   };
  // }
}
