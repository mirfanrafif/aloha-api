import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import {
  MessageEntity,
  MessageStatus,
  MessageType,
} from 'src/core/repository/chat/chat.entity';
import { CHAT_REPOSITORY } from 'src/core/repository/chat/chat.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import {
  WablasApiResponse,
  DocumentMessage,
  ImageMessage,
  MessageRequest,
  MessageResponse,
  SendMessageResponseData,
  TextMessage,
} from './chat.dto';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private http: HttpService,
    private gateway: ChatGateway,
    @Inject(CHAT_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private customerService: CustomerService,
  ) {}

  sendMessageToCustomer(
    messageRequest: MessageRequest,
    salesId: number,
  ): ApiResponse<MessageEntity[] | null> {
    let result: ApiResponse<MessageEntity[] | null>;
    this.http
      .post('/api/v2/send-bulk/text', messageRequest, {
        headers: {
          Authorization: process.env.WABLAS_TOKEN,
        },
      })
      .subscribe({
        next: async (
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
            this.gateway.sendMessage(message);
          });
          result = {
            success: true,
            data: messages,
            message: 'Success sending chat to Wablas API',
          };
        },
        error: (value: AxiosError<WablasApiResponse<null>>) => {
          console.log(value.response.data);
          result = {
            success: false,
            data: null,
            message:
              'Failed to send chat to Wablas API. Message : ' + value.message,
          };
        },
      });
    return result;
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
    this.gateway.sendMessage(data);
    return {
      success: true,
      message: 'Success catch data from Wablas API',
      data: data,
    };
  }
}
