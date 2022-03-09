import { Inject, Injectable } from '@nestjs/common';
import { CustomerSales } from 'src/core/repository/customer-sales/customer-sales.entity';
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
    const user = await this.userRepository.findOneOrFail(id);
    return {
      success: true,
      data: this.getUserData(user),
      message: 'Success getting profile data with user id ' + id,
    };
  }

  async getCustomerBySalesId(user: UserEntity, lastCustomerId?: number) {
    const messages = await this.customerService.getCustomerBySales(
      user,
      lastCustomerId,
    );
    const result: ApiResponse<CustomerSales[]> = {
      success: true,
      data: messages,
      message: `Success getting customer list by sales id ${user.id}`,
    };
    return result;
  }

  getUserData(user: UserEntity) {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      profile_photo_url: user.profile_photo_url,
    };
  }
}
