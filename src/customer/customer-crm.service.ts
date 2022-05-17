import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { catchError, map, Observable, switchMap } from 'rxjs';
import { CONVERSATION_REPOSITORY } from 'src/core/repository/conversation/conversation-repository.module';
import {
  ConversationEntity,
  ConversationStatus,
} from 'src/core/repository/conversation/conversation.entity';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { CUSTOMER_REPOSITORY } from 'src/core/repository/customer/customer.module';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
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
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<UserEntity>,
    @Inject(CUSTOMER_AGENT_REPOSITORY)
    private customerSalesRepository: Repository<CustomerAgent>,
    @Inject(CONVERSATION_REPOSITORY)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  login(): Observable<AxiosResponse<LoginResponse, any>> {
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
      catchError(async () => {
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
    return this.login().pipe(
      map((response) => response.data.access_token),
      switchMap((accessToken) =>
        this.http.get<CustomerResponse>('/customers', {
          params: {
            'filter.telephones': '$eq:' + phoneNumber,
            limit: 1,
          },
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        }),
      ),
      //simpan ke database jika ada isinya, kalo gaada return array kosong
      map(async (response) => {
        if (response.status > 400) {
          const customers: CustomerEntity[] = [];
          return customers;
        }

        if (response.data.data.length === 0) {
          const customers: CustomerEntity[] = [];
          return customers;
        }

        const customers = response.data.data;
        const newCustomers = await this.saveCustomerFromCrm(customers);
        return newCustomers;
      }),
      //cari di db kalo hasil search di crm kosong
      map(async (customers) => {
        let newCustomers = await customers;
        if (newCustomers.length === 0) {
          const convertedPhoneNumber = this.convertPhoneNumber(phoneNumber);
          if (convertedPhoneNumber === undefined) {
            const newCustomers: CustomerEntity[] = [];
            return newCustomers;
          }

          newCustomers = await this.customerRepository.find({
            where: {
              phoneNumber: Like(convertedPhoneNumber),
            },
            take: pageSize,
            order: {
              name: 'ASC',
            },
          });
          return newCustomers;
        }

        return customers;
      }),
      catchError(async () => {
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
      const phoneNumber = this.convertPhoneNumber(customer.telephones);

      //jika sudah ada di list, maka continue
      if (
        newCustomers.find(
          (findCustomer) => findCustomer.phoneNumber === phoneNumber,
        ) !== undefined
      ) {
        continue;
      }

      //jika phone numbernya undefined, maka continue

      if (phoneNumber === undefined) {
        continue;
      }

      //buat data customer
      const existingCustomer = await this.customerRepository.findOne({
        where: {
          phoneNumber: phoneNumber,
        },
      });

      if (existingCustomer !== null) {
        existingCustomer.name = customer.full_name;
        await this.customerRepository.save(existingCustomer);
      }

      //jika belum ada data customer ini di database, maka tambahkan
      const newCustomer =
        existingCustomer !== null
          ? existingCustomer
          : await this.customerRepository.save({
              name: customer.full_name,
              phoneNumber: phoneNumber,
              customerCrmId: customer.id,
            });

      const customerSales = await this.customerSalesRepository.find({
        where: {
          customer: {
            id: newCustomer.id,
          },
        },
        relations: {
          customer: true,
          agent: true,
        },
      });

      if (customerSales.length > 0) {
        this.customerSalesRepository.delete(
          customerSales.map((item) => item.id),
        );
      }

      for (const sales of customer.users) {
        //cari sales yang bersangkutan dari crm di aloha
        const alohaSales = await this.userRepository.findOne({
          where: {
            username: sales.username,
          },
        });

        //jika data sales tidak ada di aloha, maka buatkan baru
        const newSales =
          alohaSales !== null
            ? alohaSales
            : await this.userRepository.save({
                full_name: sales.full_name,
                username: sales.username,
                email: sales.email,
                password: '',
                role: Role.agent,
              });

        //cek customer sudah di assign ke sales
        const customerAgent = await this.customerSalesRepository.findOne({
          where: {
            customer: {
              id: newCustomer.id,
            },
            agent: {
              id: newSales.id,
            },
          },
          relations: {
            agent: true,
            customer: true,
          },
        });

        //jika belum ada, assign dia ke sales yang sama seperti di crm
        if (customerAgent === null) {
          await this.customerSalesRepository.save({
            customer: newCustomer,
            agent: newSales,
          });
        }
      }

      //cek conversation
      const conversation = await this.conversationRepository.findOne({
        where: {
          customer: {
            id: newCustomer.id,
          },
        },
        relations: {
          customer: true,
        },
      });

      //jika belum ada, maka connect langsung conversationnya
      if (conversation === null) {
        await this.conversationRepository.save({
          status: ConversationStatus.CONNECTED,
          customer: newCustomer,
        });
      } else {
        conversation.status = ConversationStatus.CONNECTED;
        await this.conversationRepository.save(conversation);
      }

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
