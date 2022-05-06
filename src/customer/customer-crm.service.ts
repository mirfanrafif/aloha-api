import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, map, switchMap } from 'rxjs';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { CUSTOMER_REPOSITORY } from 'src/core/repository/customer/customer.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Like, Repository } from 'typeorm';
import {
  CrmCustomer,
  CustomerCategoriesResponse,
  CustomerCrmSearchFilter,
  CustomerInterestsResponse,
  CustomerResponse,
  LoginResponse,
} from './customer.dto';

const pageSize = 20;

@Injectable()
export class CustomerCrmService {
  constructor(
    private http: HttpService,
    @Inject(CUSTOMER_REPOSITORY)
    private customerRepository: Repository<CustomerEntity>,
    private configService: ConfigService,
  ) {}

  login() {
    const loginRequest = {
      username: this.configService.get('CRM_USERNAME'),
      password: this.configService.get('CRM_PASSWORD'),
    };
    return this.http.post<LoginResponse>('/auth/login', loginRequest);
  }

  getCustomerCategories() {
    return this.login().pipe(
      map((response) => {
        return response.data.access_token;
      }),
      switchMap((accessToken) =>
        this.http.get<CustomerCategoriesResponse>('/customer_categories', {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
          params: {
            limit: 100,
          },
        }),
      ),
      map((response) => {
        return response.data;
      }),
      catchError((err) => {
        throw new InternalServerErrorException(err.message);
      }),
    );
  }

  getCustomerInterests() {
    return this.login().pipe(
      map((response) => {
        return response.data.access_token;
      }),
      switchMap((accessToken) =>
        this.http.get<CustomerInterestsResponse>('/customer_interests', {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
          params: {
            limit: 100,
          },
        }),
      ),
      map((response) => {
        return response.data;
      }),
      catchError((err) => {
        throw new InternalServerErrorException(err.message);
      }),
    );
  }

  getCustomerTypes() {
    return this.login().pipe(
      map((response) => {
        return response.data.access_token;
      }),
      switchMap((accessToken) =>
        this.http.get<CustomerInterestsResponse>('/customer_types', {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
          params: {
            limit: 100,
          },
        }),
      ),
      map((response) => {
        return response.data;
      }),
      catchError((err) => {
        throw new InternalServerErrorException(err.message);
      }),
    );
  }

  getCustomerWithFilters(filters: CustomerCrmSearchFilter) {
    return this.getCustomerFromCrm(filters).pipe(
      catchError((err) => {
        throw new InternalServerErrorException(err.message);
      }),
    );
  }

  async findCustomerByName(search: string, page?: number) {
    if (search === undefined) {
      throw new BadRequestException('Search not defined');
    }

    const params = {
      page: page ?? 1,
      limit: pageSize,
      search: search,
    };

    return this.getCustomerFromCrm(params).pipe(
      map(async (value) => {
        return <ApiResponse<any>>{
          success: true,
          data: await value,
          message: 'Success getting customer data from CRM API',
        };
      }),
      catchError(async (err: AxiosError<any>) => {
        const customers = await this.customerRepository.find({
          where: {
            name: Like(search),
          },
          take: pageSize,
          skip: pageSize * ((page ?? 1) - 1),
          order: {
            name: 'ASC',
          },
        });
        return customers;
      }),
    );
  }

  findWithPhoneNumber(phoneNumber: string) {
    return this.http
      .get<CustomerResponse>('/customers', {
        params: {
          'filter.telephones': '$eq:' + phoneNumber,
          limit: 1,
        },
        headers: {
          Authorization: 'Bearer ' + process.env.CRM_TOKEN,
        },
      })
      .pipe(
        map(async (response) => {
          if (response.status > 400) {
            throw new Error('Error when searching customer from CRM');
          }

          if (response.data.data.length === 0) {
            throw new Error('Error when searching customer from CRM');
          }

          const customers = response.data.data;
          const newCustomers = await this.saveCustomerFromCrm(customers);
          return newCustomers;
        }),
        catchError(async (err) => {
          const convertedPhoneNumber = this.convertPhoneNumber(phoneNumber);
          if (convertedPhoneNumber === undefined) {
            const newCustomers: CustomerEntity[] = [];
            return newCustomers;
          }

          const customers = await this.customerRepository.find({
            where: {
              phoneNumber: Like(convertedPhoneNumber),
            },
            take: pageSize,
            order: {
              name: 'ASC',
            },
          });
          return customers;
        }),
      );
  }

  getCustomerFromCrm(params) {
    return this.login().pipe(
      map((response) => {
        return response.data.access_token;
      }),
      switchMap((accessToken) =>
        this.http.get<CustomerResponse>(`/customers`, {
          params: params,
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        }),
      ),
      map(async (response) => {
        if (response.status < 400) {
          const customers = response.data.data;

          const newCustomers = await this.saveCustomerFromCrm(customers);
          return newCustomers;
        } else {
          return [];
        }
      }),
    );
  }

  async saveCustomerFromCrm(customers: CrmCustomer[]) {
    const newCustomers: CustomerEntity[] = [];

    for (const customer of customers) {
      if (
        newCustomers.find(
          (findCustomer) => findCustomer.phoneNumber === phoneNumber,
        ) !== undefined
      ) {
        continue;
      }

      const phoneNumber = this.convertPhoneNumber(customer.telephones);

      if (phoneNumber === undefined) {
        continue;
      }

      const existingCustomer = await this.customerRepository.findOne({
        where: [
          {
            phoneNumber: phoneNumber,
          },
        ],
      });
      if (existingCustomer !== null) {
        newCustomers.push(existingCustomer);
        continue;
      }

      let newCustomer = this.customerRepository.create({
        name: customer.full_name,
        phoneNumber: phoneNumber,
        customerCrmId: customer.id,
      });
      newCustomer = await this.customerRepository.save(newCustomer);
      newCustomers.push(newCustomer);
    }

    return newCustomers;
  }

  convertPhoneNumber(telephones: string): string | undefined {
    let phoneNumber = '';

    const telephonesArray = telephones.split(',');

    if (telephonesArray.length == 0) {
      return;
    }

    if (telephonesArray[0].startsWith('0')) {
      phoneNumber = '62' + telephonesArray[0].slice(1);
    } else {
      phoneNumber = telephonesArray[0];
    }
    phoneNumber = phoneNumber.split('-').join('');

    return phoneNumber;
  }
}
