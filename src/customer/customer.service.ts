import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from 'src/core/repository/customer-agent/customer-agent.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
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
}
