import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs';
import {
  MessageEntity,
  MessageStatus,
  MessageType,
} from 'src/core/repository/message/message.entity';
import { MESSAGE_REPOSITORY } from 'src/core/repository/message/message.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { WablasAPIException } from 'src/utils/wablas.exception';
import { LessThan, Repository } from 'typeorm';
import {
  WablasApiResponse,
  DocumentMessage,
  ImageMessage,
  MessageRequest,
  MessageResponse,
  SendMessageResponseData,
  TextMessage,
} from './message.dto';
import { MessageGateway } from './message.gateway';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';

const pageSize = 20;

@Injectable()
export class MessageService {
  constructor(
    private http: HttpService,
    private gateway: MessageGateway,
    @Inject(MESSAGE_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private customerService: CustomerService,
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<UserEntity>,
  ) {}

  sendMessageToCustomer(messageRequest: MessageRequest, agentId: number) {
    return this.http
      .post('/api/v2/send-bulk/text', messageRequest, {
        headers: {
          Authorization:
            process.env.WABLAS_TOKEN !== undefined
              ? process.env.WABLAS_TOKEN
              : '',
        },
      })
      .pipe(
        map(
          async (
            value: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
          ) => {
            const messageResponse: MessageResponse[] =
              value.data.data.message.map((message) => ({
                consumerNumber: message.phone,
                senderId: agentId.toString(),
                message: message.message,
                messageId: message.id,
                status: message.status,
              }));
            const messages = await this.saveMessage(
              messageResponse,
              agentId,
              MessageType.outgoing,
            );
            messages.forEach((message: MessageEntity) => {
              this.sendMessage(message);
            });
            const result: ApiResponse<MessageEntity[]> = {
              success: true,
              data: messages,
              message: 'Success sending message to Wablas API',
            };
            return result;
          },
        ),
        catchError((value: AxiosError<WablasApiResponse<null>>) => {
          if (value.response !== undefined) {
            const result: ApiResponse<MessageEntity[]> = {
              success: false,
              data: [],
              message:
                'Failed to send message to Wablas API. Message : ' +
                value.response.data.message,
            };
            throw new WablasAPIException(result);
          }
          throw new WablasAPIException({
            success: false,
            message: 'Failed to send message to Wablas API.',
          });
        }),
      );
  }

  async saveMessage(
    messageResponses: MessageResponse[],
    agentId: number,
    type: MessageType,
  ): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    const agent = await this.userRepository.findOneOrFail(agentId);

    messageResponses.forEach(async (messageResponse) => {
      const message = await this.messageRepository.save({
        messageId: messageResponse.messageId,
        message: messageResponse.message,
        customerNumber: messageResponse.consumerNumber,
        agent: agent,
        status: messageResponse.status,
        type: type,
      });
      messages.push(message);
    });

    return messages;
  }

  async handleIncomingMessage(
    message: DocumentMessage | ImageMessage | TextMessage,
  ): Promise<ApiResponse<MessageEntity>> {
    let agent = await this.customerService.findAgentByCostumerNumber(
      message.phone,
    );

    if (agent == null) {
      agent = await this.customerService.assignCustomerToAgent(
        message.phone,
        7,
      );
    }

    const data: MessageEntity = await this.messageRepository.save({
      customerNumber: message.phone,
      message: message.message,
      messageId: message.id,
      agent: agent,
      status: MessageStatus.received,
      type: MessageType.incoming,
      created_at: Date(),
    });
    this.sendMessage(data);
    return {
      success: true,
      message: 'Success catch data from Wablas API',
      data: data,
    };
  }

  async getPastMessageByCustomerNumber(
    customerNumber: string,
    lastMessageId: number,
    agent: UserEntity,
  ) {
    let condition = {};
    if (agent.role !== 'admin') {
      condition = {
        ...condition,
        agent: agent,
      };
    }
    if (lastMessageId > 0) {
      condition = {
        ...condition,
        id: LessThan(lastMessageId),
      };
    }
    const result: MessageEntity[] = await this.messageRepository.find({
      where: {
        customerNumber: customerNumber,
        ...condition,
      },
      take: pageSize,
      order: {
        created_at: 'DESC',
      },
    });
    const response: ApiResponse<MessageEntity[]> = {
      success: true,
      data: result,
      message: 'Success retrieving data from customer number ' + customerNumber,
    };
    return response;
  }

  sendMessage(data: MessageEntity) {
    this.gateway.server
      .to('message:' + data.agent)
      .to('message:admin')
      .emit('message', data);
  }
}
