import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from 'src/core/repository/customer-agent/customer-agent.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { MessageRequestDto } from 'src/messages/message.dto';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { MoreThan, Repository } from 'typeorm';

const pageSize = 20;
@Injectable()
export class CustomerService {
  constructor(
    private httpService: HttpService,
    @Inject(CUSTOMER_AGENT_REPOSITORY)
    private customerRepository: Repository<CustomerAgent>,
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<UserEntity>,
  ) {}
  async findAgentByCostumerNumber(customerNumber: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        customerNumber: customerNumber,
      },
      relations: ['agent'],
    });
    return customer;
  }

  async assignCustomerToAgent(customerNumber: string, agentId: number) {
    const customerAgent = this.customerRepository.create();
    const agent = await this.userRepository.findOneOrFail(agentId);
    customerAgent.agent = agent;
    customerAgent.customerNumber = customerNumber;
    customerAgent.created_at = Date();
    return await this.customerRepository.save(customerAgent);
  }

  async getCustomerByAgent(agent: UserEntity, lastCustomerId?: number) {
    let condition = {};

    if (agent.role !== 'admin') {
      condition = {
        ...condition,
        agent: agent,
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

  async agentShouldHandleCustomer(
    messageRequest: MessageRequestDto,
    agent: UserEntity,
  ) {
    const customer = await this.customerRepository.findOneOrFail({
      where: {
        customerNumber: messageRequest.customerNumber,
      },
      relations: ['agent'],
    });

    if (customer === undefined) {
      const result = {
        success: false,
        data: null,
        message: 'Customer not found',
      };
      throw new HttpException(result, HttpStatus.NOT_FOUND);
    }

    if (customer.agent.id !== agent.id) {
      const result: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Agent are not handling this customer',
      };
      throw new HttpException(result, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
