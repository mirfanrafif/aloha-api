import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { CustomerSales } from 'src/core/repository/customer-sales/customer-sales.entity';
import { CUSTOMER_SALES_REPOSITORY } from 'src/core/repository/customer-sales/customer-sales.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { Repository } from 'typeorm';
import { Customer } from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private httpService: HttpService,
    @Inject(CUSTOMER_SALES_REPOSITORY)
    private customerRepository: Repository<CustomerSales>,
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<UserEntity>,
  ) {}
  async findSalesByCostumerNumber(customerNumber: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        customerNumber: customerNumber,
      },
      relations: ['sales'],
    });
    return customer;
  }

  async assignCustomerToSales(customerNumber: string, salesId: number) {
    const customerSales = this.customerRepository.create();
    const sales = await this.userRepository.findOne(salesId);
    customerSales.sales = sales;
    customerSales.customerNumber = customerNumber;
    this.customerRepository.save(customerSales);
  }
}
