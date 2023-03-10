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
import { CONVERSATION_REPOSITORY } from '../repository/conversation/conversation-repository.module';
import {
  ConversationEntity,
  ConversationStatus,
} from '../repository/conversation/conversation.entity';
import { CustomerAgent } from '../repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from '../repository/customer-agent/customer-agent.module';
import { CustomerEntity } from '../repository/customer/customer.entity';
import { CUSTOMER_REPOSITORY } from '../repository/customer/customer.module';
import { Role, UserEntity } from '../repository/user/user.entity';
import { USER_REPOSITORY } from '../repository/user/user.module';
import { ApiResponse } from '../../utils/apiresponse.dto';
import { In, Like, Repository } from 'typeorm';
import { UserJobEntity } from '../repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from '../repository/user-job/user-job.module';
import {
  CrmCustomer,
  CustomerCategoriesResponse,
  CustomerCrmSearchFilter,
  CustomerInterestsResponse,
  CustomerResponse,
  LoginResponse,
} from './customer-crm.dto';
import { convertPhoneNumber } from './customer.helper';

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
    @Inject(USER_JOB_REPOSITORY)
    private userJobRepository: Repository<UserJobEntity>,
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
    return this.getCustomerFromCrm({
      'filter.telephones': '$eq:' + phoneNumber,
      limit: 1,
    }).pipe(
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

  private getCustomerFromCrm(params) {
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
      const phoneNumber = convertPhoneNumber(customer.telephones);

      //jika sudah ada di list, maka lewati
      if (
        newCustomers.find(
          (findCustomer) => findCustomer.phoneNumber === phoneNumber,
        ) !== undefined
      ) {
        continue;
      }

      //jika phone numbernya tidak valid, maka lewati
      if (phoneNumber === undefined) {
        continue;
      }

      const findCustomerWithPhone = await this.customerRepository.findOne({
        where: {
          phoneNumber: phoneNumber,
        },
      });

      //cari customer berdasarkan id di crm
      const findCustomerWithCrmId =
        findCustomerWithPhone !== null
          ? findCustomerWithPhone
          : await this.customerRepository.findOne({
              where: {
                customerCrmId: customer.id,
              },
            });

      if (findCustomerWithCrmId !== null) {
        findCustomerWithCrmId.name = customer.full_name;
        findCustomerWithCrmId.phoneNumber = phoneNumber;
        await this.customerRepository.save(findCustomerWithCrmId);
      }

      //jika belum ada data customer ini di database, maka tambahkan
      const newCustomer =
        findCustomerWithCrmId !== null
          ? findCustomerWithCrmId
          : await this.customerRepository.save({
              name: customer.full_name,
              phoneNumber: phoneNumber,
              customerCrmId: customer.id,
            });

      for (const sales of customer.users) {
        //cari sales yang bersangkutan dari crm di aloha
        const alohaSales = await this.userRepository.findOne({
          where: {
            username: sales.username,
          },
          relations: {
            job: {
              job: true,
            },
          },
          withDeleted: true,
        });

        //jika sales aktif, maka cek apakah sudah di assign ke sales ini apa belum
        if (alohaSales !== null && alohaSales.deleted_at === undefined) {
          //cek customer sudah di assign ke sales
          const customerAgent = await this.customerSalesRepository.findOne({
            where: {
              customer: {
                id: newCustomer.id,
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
              agent: alohaSales,
            });
          }
          //jika sales dihapus, maka assign ke sales penggantis
        } else if (alohaSales !== null && alohaSales.deleted_at !== null) {
          const userJob = alohaSales.job;
          const jobList = userJob.map((job) => job.job);

          //cek apakah sales ini memiliki job pengganti
          const replacementSales = await this.userJobRepository.find({
            where: {
              job: {
                id: In(jobList.map((job) => job.id)),
              },
            },
            relations: {
              agent: {
                customer: true,
              },
              job: true,
            },
          });

          if (replacementSales.length > 0) {
            //find sales pengganti yang memiliki customer paling sedikit
            const replacementSalesWithLeastCustomer = replacementSales.reduce(
              (prev, current) =>
                prev.agent.customer.length < current.agent.customer.length
                  ? prev
                  : current,
            );

            //cek customer sudah di assign ke sales
            const customerAgent = await this.customerSalesRepository.findOne({
              where: {
                customer: {
                  id: newCustomer.id,
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
                agent: replacementSalesWithLeastCustomer.agent,
              });
            }
          } else {
            //
            // TODO: jika tidak ada sales pengganti, maka
          }
        } else if (alohaSales === null) {
          // jika data sales tidak ada di aloha, maka buatkan baru
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

    if (phoneNumber.length === 0) return;
    phoneNumber = phoneNumber.split('-').join('');
    phoneNumber = phoneNumber.split(' ').join('');

    return phoneNumber;
  }

  findWithPhoneNumberList(phoneNumber: string[]) {
    const phoneNumberString = phoneNumber.join(',');
    return this.getCustomerFromCrm({
      'filter.telephones': '$in:' + phoneNumberString,
      limit: 1000,
    }).pipe(
      map(async (customers) => {
        let newCustomers = await customers;
        if (newCustomers.length === 0) {
          const convertedPhoneNumber = phoneNumber
            .map((phoneNumber) => {
              return convertPhoneNumber(phoneNumber);
            })
            .filter((item) => item !== undefined);
          if (convertedPhoneNumber === undefined) {
            const newCustomers: CustomerEntity[] = [];
            return newCustomers;
          }

          newCustomers = await this.customerRepository.find({
            where: {
              phoneNumber: In(convertedPhoneNumber),
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
        const convertedPhoneNumber = phoneNumber.map((item) => {
          return convertPhoneNumber(item);
        });
        if (convertedPhoneNumber === undefined) {
          const newCustomers: CustomerEntity[] = [];
          return newCustomers;
        }

        const customers = await this.customerRepository.find({
          where: {
            phoneNumber: In(convertedPhoneNumber),
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
}
