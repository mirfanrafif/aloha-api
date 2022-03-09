import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs';
import {
  MessageEntity,
  MessageStatus,
  MessageType,
} from 'src/core/repository/chat/message.entity';
import { CHAT_REPOSITORY as MESSAGE_REPOSITORY } from 'src/core/repository/chat/chat.module';
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
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { UserEntity } from 'src/core/repository/user/user.entity';

const pageSize = 20;

@Injectable()
export class MessageService {
  constructor(
    private http: HttpService,
    private gateway: MessageGateway,
    @Inject(MESSAGE_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private customerService: CustomerService,
  ) {}

  sendMessageToCustomer(messageRequest: MessageRequest, salesId: number) {
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
                senderId: salesId.toString(),
                message: message.message,
                messageId: message.id,
                status: message.status,
              }));
            const messages = await this.saveChat(
              messageResponse,
              salesId,
              MessageType.outgoing,
            );
            messages.forEach((message: MessageEntity) => {
              this.sendMessage(message);
            });
            const result: ApiResponse<MessageEntity[]> = {
              success: true,
              data: messages,
              message: 'Success sending chat to Wablas API',
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
                'Failed to send chat to Wablas API. Message : ' +
                value.response.data.message,
            };
            throw new WablasAPIException(result);
          }
          throw new WablasAPIException({
            success: false,
            message: 'Failed to send chat to Wablas API.',
          });
        }),
      );
  }

  async saveChat(
    messageResponses: MessageResponse[],
    salesId: number,
    type: MessageType,
  ): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    messageResponses.forEach(async (messageResponse) => {
      const message = await this.messageRepository.save({
        messageId: messageResponse.messageId,
        message: messageResponse.message,
        customerNumber: messageResponse.consumerNumber,
        salesId: salesId,
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
    let sales = await this.customerService.findSalesByCostumerNumber(
      message.phone,
    );

    if (sales == null) {
      sales = await this.customerService.assignCustomerToSales(
        message.phone,
        1,
      );
    }

    const data: MessageEntity = await this.messageRepository.save({
      customerNumber: message.phone,
      message: message.message,
      messageId: message.id,
      salesId: sales.sales.id,
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
    lastMessageId?: number,
    salesId?: number,
  ) {
    const result: MessageEntity[] =
      lastMessageId !== undefined
        ? await this.messageRepository.find({
            where: {
              customerNumber: customerNumber,
              salesId: salesId,
              id: LessThan(lastMessageId),
            },
            take: pageSize,
            order: {
              created_at: 'DESC',
            },
          })
        : await this.messageRepository.find({
            where: {
              customerNumber: customerNumber,
              salesId: salesId,
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
      .to('chat:' + data.salesId)
      .to('chat:admin')
      .emit('chat', data);
  }
}
