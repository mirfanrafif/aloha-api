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

  getCurrentUser() {
    return this.userRepository.find();
  }

  async getCustomerBySalesId(id: number, page: number) {
    const sales = await this.userRepository.findOneOrFail(id);
    const messages = await this.customerService.getCustomerBySales(sales, page);
    const result: ApiResponse<CustomerSales[]> = {
      success: true,
      data: messages,
      message: `Success getting customer list by sales id ${id}`,
    };
    return result;
  }
}
