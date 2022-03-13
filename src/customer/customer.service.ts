import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

  //Mencari agen yang menangani customer tersebut
  async findAgentByCustomerNumber(customerNumber: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        customerNumber: customerNumber,
      },
      relations: ['agent'],
    });
    return customer;
  }

  //Mendelegasi agen dengan customer
  async assignCustomerToAgent(customerNumber: string, agentId: number) {
    const agent = await this.userRepository.findOneOrFail(agentId);

    const existingCustomerAgent = await this.customerRepository.findOne({
      where: {
        customerNumber: customerNumber,
        agent: agent,
      },
    });

    if (existingCustomerAgent) {
      throw new BadRequestException('Customer already assigned to this agent');
    }

    const customerAgent = this.customerRepository.create({
      agent: agent,
      customerNumber: customerNumber,
    });
    return await this.customerRepository.save(customerAgent);
  }

  //mengambil data customer berdasarkan agen (halaman list pesan)
  async getCustomerByAgent(agent: UserEntity, lastCustomerId?: number) {
    const conditions = {};
    const relations: string[] = [];

    if (agent.role !== 'admin') {
      conditions['agent'] = agent;
    } else {
      relations.push('agent');
    }
    if (lastCustomerId !== undefined) {
      conditions['id'] = MoreThan(lastCustomerId);
    }

    /* TODO: Untuk get customer by number ini route untuk pesan.
    Jadi berikan pesan terakhir untuk display */
    const listCustomer = await this.customerRepository.find({
      where: conditions,
      relations: relations,
      take: pageSize,
    });
    return listCustomer;
  }

  /*
  cek apakah agen mengurus customer tersebut. 
  jika tidak maka throw beberapa error yang berhubungan 
   */
  async agentShouldHandleCustomer(
    messageRequest: MessageRequestDto,
    agent: UserEntity,
  ) {
    const customer = await this.customerRepository.findOneOrFail({
      where: {
        customerNumber: messageRequest.customerNumber,
        agent: agent,
      },
      relations: ['agent'],
    });

    if (customer === undefined) {
      throw new UnauthorizedException();
    }

    // if (customer.agent.id !== agent.id) {
    //   const result: ApiResponse<null> = {
    //     success: false,
    //     data: null,
    //     message: 'Agent are not handling this customer',
    //   };
    //   throw new HttpException(result, HttpStatus.FORBIDDEN);
    // }

    return true;
  }
}
