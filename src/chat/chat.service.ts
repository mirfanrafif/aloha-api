import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import {
  MessageEntity,
  MessageStatus,
  MessageType,
} from 'src/core/repository/chat/chat.entity';
import { CHAT_REPOSITORY } from 'src/core/repository/chat/chat.module';
import { Repository } from 'typeorm';
import {
  ApiResponse,
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
  ) {}

  sendMessage(
    messageRequest: MessageRequest,
  ): ApiResponse<SendMessageResponseData | null> {
    let result: ApiResponse<SendMessageResponseData | null>;
    const { salesId, ...data } = messageRequest;
    this.http
      .post('/api/v2/send-bulk/text', data, {
        headers: {
          Authorization:
            'f7b8lBzoaGXSvX2JkZwycD8ZT1Yk6bIrRXQ1E7h1sEIk2pq0WFdwUhcQvedZ7pkb',
        },
      })
      .subscribe({
        next: (value: AxiosResponse<ApiResponse<SendMessageResponseData>>) => {
          console.log(value.data.data);

          const messageResponse: MessageResponse[] =
            value.data.data.message.map((message) => ({
              consumerNumber: message.phone,
              senderId: salesId.toString(),
              message: message.message,
              messageId: message.id,
              status: message.status,
            }));
          this.gateway.sendMessage(messageResponse);
          this.saveChat(messageResponse, salesId, MessageType.outgoing);
          result = value.data;
        },
        error: (value: AxiosError<ApiResponse<null>>) => {
          console.log(value.response.data);
          result = value.response.data;
        },
      });
    return result;
  }

  saveChat(
    messageResponses: MessageResponse[],
    salesId: number,
    type: MessageType,
  ) {
    messageResponses.forEach((messageResponse) => {
      this.messageRepository.save({
        messageId: messageResponse.messageId,
        message: messageResponse.message,
        customerNumber: messageResponse.consumerNumber,
        salesId: salesId,
        status: messageResponse.status,
        type: type,
      });
    });
  }

  async handleIncomingMessage(
    message: DocumentMessage | ImageMessage | TextMessage,
  ) {
    const data: MessageEntity = await this.messageRepository.save({
      customerNumber: message.phone,
      message: message.message,
      messageId: message.id,
      salesId: 1,
      status: MessageStatus.received,
      type: MessageType.incoming,
    });
    this.gateway.sendMessage(data);
  }
}
