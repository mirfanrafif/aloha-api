import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, map } from 'rxjs';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { CUSTOMER_REPOSITORY } from 'src/core/repository/customer/customer.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { MoreThan, Repository } from 'typeorm';
import {
  CustomerAgentArrDto,
  CustomerResponse,
  DelegateCustomerRequestDto,
} from './customer.dto';

const pageSize = 20;
@Injectable()
export class CustomerService {
  constructor(
    private httpService: HttpService,
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<UserEntity>,
    @Inject(CUSTOMER_REPOSITORY)
    private customerRepository: Repository<CustomerEntity>,
    @Inject(CUSTOMER_AGENT_REPOSITORY)
    private customerAgentRepository: Repository<CustomerAgent>,
  ) {}

  async findAndCreateCustomer({
    phoneNumber,
    name,
  }: {
    phoneNumber: string;
    name?: string;
  }): Promise<CustomerEntity> {
    const findCustomer = await this.customerRepository.findOne({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (findCustomer !== null) {
      return findCustomer;
    }

    const newCustomer = await this.customerRepository.save({
      name: name,
      phoneNumber: phoneNumber,
    });

    return newCustomer;
  }

  async findCustomer({ phoneNumber }: { phoneNumber: string }) {
    return await this.customerRepository.findOneOrFail({
      where: {
        phoneNumber: phoneNumber,
      },
    });
  }

  //Mencari agen yang menangani customer tersebut
  async findAgentByCustomerNumber({ customer }: { customer: CustomerEntity }) {
    const agents = await this.customerAgentRepository.findOne({
      where: {
        customer: {
          id: customer.id,
        },
      },
      relations: {
        agent: true,
      },
    });
    return agents;
  }

  //Mendelegasi agen dengan customer
  async assignCustomerToAgent({
    customer,
    agentJob,
  }: {
    customer: CustomerEntity;
    agentJob: number;
  }) {
    const agent = await this.userRepository.find({
      where: {
        job: {
          id: agentJob,
        },
      },
      relations: {
        customer: true,
      },
    });

    //cari agent yang melayani customer paling sedikit agar seimbang
    //mohon maaf algorithm nya jelek hehehe
    const agentCustomersCount = agent.map(
      (agentItem) => agentItem.customer.length,
    );

    let agentWithMinimumCustomerIndex = 0;
    let agentWithMinimumCustomerCount = agentCustomersCount[0];

    agentCustomersCount.forEach((item, index) => {
      if (item < agentWithMinimumCustomerCount) {
        agentWithMinimumCustomerIndex = index;
        agentWithMinimumCustomerCount = item;
      }
    });

    const customerAgent = this.customerAgentRepository.create({
      agent: agent[agentWithMinimumCustomerIndex],
      customer: customer,
    });
    const result = await this.customerAgentRepository.save(customerAgent);
    return result;
  }

  //Mendelegasi agen dengan customer
  async delegateCustomerToAgent(body: DelegateCustomerRequestDto) {
    const customer = await this.customerRepository.findOneOrFail({
      where: {
        id: body.customerId,
      },
    });

    const agent = await this.userRepository.findOneOrFail({
      where: {
        id: body.agentId,
      },
    });

    const existingCustomerAgent = await this.customerAgentRepository.findOne({
      where: {
        customer: {
          id: customer.id,
        },
        agent: {
          id: agent.id,
        },
      },
    });

    if (existingCustomerAgent) {
      throw new BadRequestException('Customer already assigned to this agent');
    }

    const customerAgent = this.customerAgentRepository.create({
      agent: agent,
      customer: customer,
    });

    const result = await this.customerAgentRepository.save(customerAgent);
    const response: ApiResponse<CustomerAgent> = {
      success: true,
      message: `Succesfully assign customer ${customer.name} to agent ${agent.full_name}`,
      data: result,
    };
    return response;
  }

  //mengambil data customer berdasarkan agen (halaman list pesan)
  async getCustomerByAgent({
    agent,
    lastCustomerId,
  }: {
    agent: UserEntity;
    lastCustomerId?: number;
  }) {
    const conditions = {};

    if (agent.role !== 'admin') {
      conditions['agent'] = agent;
    }
    if (lastCustomerId !== undefined) {
      conditions['id'] = MoreThan(lastCustomerId);
    }
    const listCustomer = await this.customerAgentRepository.find({
      where: conditions,
      relations: {
        agent: true,
        customer: true,
      },
      take: pageSize,
    });

    const newListCustomer = this.mappingCustomerAgent(listCustomer);

    return newListCustomer;
  }

  /*
  karena pada 1 customer terdapat beberapa sales, maka harus dimapping 
  agar data customer tersebut tidak duplikat, tetapi salesnya disimpan
  dalam sebuah array
   */
  mappingCustomerAgent(listCustomer: CustomerAgent[]) {
    const newListCustomer: CustomerAgentArrDto[] = [];

    listCustomer.forEach((customerItem) => {
      const customerIndex = newListCustomer.findIndex(
        (value) => value.customer.id == customerItem.customer.id,
      );

      if (customerIndex > -1) {
        newListCustomer[customerIndex].agent.push(customerItem.agent);
        return;
      }
      newListCustomer.push({
        id: customerItem.id,
        agent: [customerItem.agent],
        customer: customerItem.customer,
        created_at: customerItem.created_at,
        updated_at: customerItem.updated_at,
      });
    });

    return newListCustomer;
  }

  /*
  cek apakah agen mengurus customer tersebut. 
  jika tidak maka throw beberapa error yang berhubungan 
   */
  async agentShouldHandleCustomer({
    customerNumber,
    agent,
  }: {
    customerNumber: string;
    agent: UserEntity;
  }) {
    const customer = await this.customerAgentRepository.findOneOrFail({
      where: {
        customer: {
          phoneNumber: customerNumber,
        },
        agent: agent,
      },
      relations: {
        agent: true,
        customer: true,
      },
    });

    if (customer === undefined) {
      throw new UnauthorizedException();
    }

    return true;
  }

  async searchCustomer({
    customerNumber,
    agent,
  }: {
    customerNumber: string;
    agent: UserEntity;
  }) {
    const conditions = {};

    if (agent.role !== 'admin') {
      conditions['agent'] = agent;
    }
    const listCustomer = await this.customerAgentRepository.find({
      where: {
        ...conditions,
        customer: {
          phoneNumber: customerNumber,
        },
      },
      relations: {
        agent: true,
        customer: true,
      },
      take: pageSize,
    });

    const newListCustomer = this.mappingCustomerAgent(listCustomer);

    return newListCustomer;
  }

  async getAllCustomersFromCrm(page: number) {
    return this.httpService
      .get<CustomerResponse>(
        `/customers?page=${page}&limit=${pageSize}&sortBy=full_name:ASC`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CRM_TOKEN}`,
          },
        },
      )
      .pipe(
        map(async (response) => {
          if (response.status < 400) {
            const customers = response.data.data;

            const newCustomers: CustomerEntity[] = [];

            for (const customer of customers) {
              const existingCustomer = await this.customerRepository.findOne({
                where: [
                  {
                    customerCrmId: customer.id,
                  },
                  {
                    phoneNumber: customer.telephones,
                  },
                ],
              });
              if (existingCustomer !== null) {
                newCustomers.push(existingCustomer);
                continue;
              }

              let newCustomer = this.customerRepository.create({
                name: customer.full_name,
                phoneNumber: customer.telephones,
                customerCrmId: customer.id,
              });
              newCustomer = await this.customerRepository.save(newCustomer);
              newCustomers.push(newCustomer);
            }
            return <ApiResponse<CustomerEntity[]>>{
              success: true,
              data: newCustomers,
              message: 'Success getting customer data from CRM API',
            };
          }
        }),
        catchError(async (err: AxiosError<any>) => {
          console.log(err);
          const customers = await this.customerRepository.find({
            take: pageSize,
            skip: pageSize * (page - 1),
            order: {
              name: 'ASC',
            },
          });
          return <ApiResponse<CustomerEntity[]>>{
            success: true,
            data: customers,
            message: `Failed to get data from CRM API. Error : ${err.message}. Getting data from database`,
          };
        }),
      );
  }

  async getAllCustomer() {
    return await this.customerRepository.find();
  }
}
