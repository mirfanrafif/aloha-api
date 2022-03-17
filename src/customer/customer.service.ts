import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { CUSTOMER_REPOSITORY } from 'src/core/repository/customer/customer.module';
import { MessageEntity } from 'src/core/repository/message/message.entity';
import { MESSAGE_REPOSITORY } from 'src/core/repository/message/message.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { MoreThan, Repository } from 'typeorm';
import {
  CustomerAgentArrDto,
  CustomerAgentResponseDto,
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

    if (findCustomer !== undefined) {
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
        customer: customer,
      },
      relations: ['agent'],
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
      relations: ['customer'],
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
        customer: customer,
        agent: agent,
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
      relations: ['agent', 'customer'],
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
        customerNumber: customerNumber,
        agent: agent,
      },
      relations: ['agent'],
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
      relations: ['agent', 'customer'],
      take: pageSize,
    });

    const newListCustomer = this.mappingCustomerAgent(listCustomer);

    return newListCustomer;
  }

  async getAllCustomer() {
    return await this.customerRepository.find();
  }
}
