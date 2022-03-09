import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { CustomerSales } from 'src/core/repository/customer-sales/customer-sales.entity';
import { CUSTOMER_SALES_REPOSITORY } from 'src/core/repository/customer-sales/customer-sales.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { MoreThan, Repository } from 'typeorm';

const pageSize = 20;
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
    const sales = await this.userRepository.findOneOrFail(salesId);
    customerSales.sales = sales;
    customerSales.customerNumber = customerNumber;
    customerSales.created_at = Date();
    return await this.customerRepository.save(customerSales);
  }

  async getCustomerBySales(sales: UserEntity, lastCustomerId?: number) {
    let condition = {};

    if (sales.role !== 'admin') {
      condition = {
        ...condition,
        sales: sales,
      };
    }
    if (lastCustomerId !== undefined) {
      condition = {
        ...condition,
        id: MoreThan(lastCustomerId),
      };
    }

    const listCustomer = await this.customerRepository.find({
      where: {
        ...condition,
      },
      take: pageSize,
    });
    return listCustomer;
  }
}
