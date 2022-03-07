import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Customer } from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(private httpService: HttpService) {}

  customerList: Customer[] = [
    {
      id: 1,
      phoneNumber: '6282257756362',
    },
  ];

  getCustomerByIdSalesId(id: number) {
    return this.customerList;
  }
}
