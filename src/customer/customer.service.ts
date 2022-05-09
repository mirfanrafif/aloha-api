import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
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
import { CustomerCrmService } from './customer-crm.service';
import {
  CustomerAgentArrDto,
  DelegateCustomerRequestDto,
} from './customer.dto';

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
    @Inject(CONVERSATION_REPOSITORY)
    private conversationRepository: Repository<ConversationEntity>,
    private customerCrmService: CustomerCrmService,
  ) {}

  async findOrCreateCustomer({
    phoneNumber,
    name,
  }: {
    phoneNumber: string;
    name: string;
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
    const customer = await this.customerRepository.findOne({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (customer === null) {
      throw new NotFoundException(
        'Customer with phone number ' + phoneNumber + ' nout found',
      );
    }

    return customer;
  }

  //Mencari agen yang menangani customer tersebut
  async findAgentByCustomerNumber({ customer }: { customer: CustomerEntity }) {
    const agents = await this.customerAgentRepository.find({
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
          job: {
            id: agentJob,
          },
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
    const customer = await this.customerRepository.findOne({
      where: {
        id: body.customerId,
      },
    });

    if (customer === null) {
      throw new NotFoundException('Customer tidak ditemukan');
    }

    const agent = await this.userRepository.findOne({
      where: {
        id: body.agentId,
      },
    });

    if (agent === null) {
      throw new NotFoundException('Sales tidak ditemukan');
    }

    const existingCustomerAgent = await this.customerAgentRepository.findOne({
      where: {
        customer: {
          id: customer.id,
        },
        agent: {
          id: agent.id,
        },
      },
      relations: {
        customer: true,
        agent: true,
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
  //Mendelegasi agen dengan customer
  async undelegateCustomerToAgent(body: DelegateCustomerRequestDto) {
    const existingCustomerAgent = await this.customerAgentRepository.findOne({
      where: {
        customer: {
          id: body.customerId,
        },
        agent: {
          id: body.agentId,
        },
      },
      relations: {
        customer: true,
        agent: true,
      },
    });

    if (existingCustomerAgent === null) {
      throw new NotFoundException('Sales tidak memegang customer ini');
    }

    await this.customerAgentRepository.delete(existingCustomerAgent.id);

    const response: ApiResponse<CustomerAgent> = {
      success: true,
      message: `Succesfully unassign customer ${existingCustomerAgent.customer.name} to sales ${existingCustomerAgent.agent.full_name}`,
      data: existingCustomerAgent,
    };
    return response;
  }

  //mengambil data customer berdasarkan agen (halaman list pesan)
  async getCustomerByAgent({
    handlerAgent,
    name,
  }: {
    handlerAgent: UserEntity;
    name?: string;
  }) {
    const listCustomer = await this.customerRepository.find({
      relations: {
        agent: {
          agent: true,
        },
        messages: {
          agent: true,
          customer: true,
        },
      },
      where: {
        name: name !== undefined ? Like(`%${name}%`) : undefined,
        agent: {
          agent:
            handlerAgent.role === Role.agent
              ? {
                  id: handlerAgent.id,
                }
              : undefined,
        },
      },
      order: {
        id: 'ASC',
        messages: {
          id: 'DESC',
        },
      },
    });

    // if (handlerAgent.role === Role.agent) {
    //   listCustomer.filter((customer) =>
    //     customer.agent.map((sales) => sales.agent.id).includes(handlerAgent.id),
    //   );
    // }

    return listCustomer;
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
    const customer = await this.customerAgentRepository.findOne({
      where: {
        customer: {
          phoneNumber: customerNumber,
        },
        agent: {
          id: agent.id,
        },
      },
      relations: {
        agent: true,
        customer: true,
      },
    });

    if (customer === null) {
      throw new UnauthorizedException("agent shouldn't handle this customer");
    }

    return true;
  }

  async getAllCustomer() {
    return await this.customerRepository.find();
  }

  async startMessageWithCustomer(customerId: number, user: UserEntity) {
    //get user
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
      },
    });

    if (customer === null) {
      throw new NotFoundException('Not found customer with id ' + customerId);
    }

    const existingConversation = await this.conversationRepository.findOne({
      where: {
        customer: {
          id: customer.id,
        },
      },
      relations: {
        customer: true,
      },
    });

    if (existingConversation !== null) {
      throw new BadRequestException(
        'Customer already connected to conversation',
      );
    }
    //create conversation
    await this.conversationRepository.save({
      customer: customer,
      status: ConversationStatus.CONNECTED,
    });

    const customerAgent = await this.customerAgentRepository.save({
      customer: customer,
      agent: user,
    });

    return <ApiResponse<CustomerAgent>>{
      success: true,
      data: customerAgent,
      message: 'Success starting conversation with customer ' + customer.name,
    };
  }

  async searchCustomerWithPhoneNumber(phoneNumber: string) {
    const customers = await lastValueFrom(
      this.customerCrmService.findWithPhoneNumber(phoneNumber),
    );
    if (customers.length === 0) {
      throw new NotFoundException(
        'Customer with phone number ' + phoneNumber + ' not found',
      );
    }

    return customers[0];
  }
}
