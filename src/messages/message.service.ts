import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs';
import {
  MessageEntity,
  MessageStatus,
} from 'src/core/repository/message/message.entity';
import { MESSAGE_REPOSITORY } from 'src/core/repository/message/message.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { WablasAPIException } from 'src/utils/wablas.exception';
import { LessThan, Repository } from 'typeorm';
import {
  WablasApiResponse,
  MessageRequestDto,
  SendMessageResponseData,
  TextMessage,
  MessageType,
  WablasSendMessageRequest,
} from './message.dto';
import { MessageGateway } from './message.gateway';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';

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

  async sendMessageToCustomer(
    messageRequest: MessageRequestDto,
    agent: UserEntity,
  ) {
    //jika role admin tidak perlu cek ini
    if (agent.role !== Role.admin) {
      //cek apakah agent handle customer. jika tidak throw Httpexception
      await this.customerService.agentShouldHandleCustomer(
        messageRequest,
        agent,
      );
    }

    //templating request
    const request: WablasSendMessageRequest = {
      data: [
        {
          phone: messageRequest.customerNumber,
          message: messageRequest.message,
          secret: false,
          retry: false,
          isGroup: false,
        },
      ],
    };

    //buat request ke WABLAS API
    return this.http
      .post('/api/v2/send-message', JSON.stringify(request), {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .pipe(
        map(
          async (
            response: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
          ) => {
            //save ke database
            const messages = await this.saveOutgoingMessage(
              response.data.data,
              agent,
            );

            //kirim ke frontend lewat websocket
            messages.forEach((message: MessageEntity) => {
              this.gateway.sendMessage(message);
            });

            //return result
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
            throw new WablasAPIException(
              'Failed to send message to Wablas API. Message : ' +
                value.response.data.message,
            );
          }
          throw new WablasAPIException({
            success: false,
            message: 'Failed to send message to Wablas API.',
          });
        }),
      );
  }

  async saveOutgoingMessage(
    messageResponses: SendMessageResponseData,
    agent: UserEntity,
  ): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    //for loop insert data
    for (const messageItem of messageResponses.messages) {
      const message = await this.messageRepository.save({
        messageId: messageItem.id,
        message: messageItem.message,
        customerNumber: messageItem.phone,
        agent: agent,
        status: messageItem.status,
        fromMe: true,
        type: MessageType.text,
        created_at: Date(),
      });
      messages.push(message);
    }

    return messages;
  }

  async handleIncomingMessage(
    message: TextMessage,
  ): Promise<ApiResponse<MessageEntity | null>> {
    //message from group
    if (message.isGroup) {
      throw new HttpException(
        'Failed to handle incoming message. Message is from group',
        HttpStatus.BAD_REQUEST,
      );
    }

    //find agent by customer
    let customerAgent = await this.customerService.findAgentByCostumerNumber(
      message.phone,
    );

    //assign customer to agent
    if (customerAgent == null) {
      customerAgent = await this.customerService.assignCustomerToAgent(
        message.phone,
        1,
      );
    }

    //create entity
    const messageEntity = this.messageRepository.create({
      customerNumber: message.phone,
      message: message.message,
      messageId: message.id,
      agent: customerAgent.agent,
      status: MessageStatus.read,
      fromMe: false,
      file: message.file,
      type: message.messageType,
      created_at: Date(),
    });

    //save entity
    const data: MessageEntity = await this.messageRepository.save(
      messageEntity,
    );

    //send to frontend via websocket
    this.gateway.sendMessage(data);
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
    //check role if not admin
    if (agent.role !== 'admin') {
      condition = {
        ...condition,
        agent: agent,
      };
    }

    //check last message id for pagination
    if (lastMessageId > 0) {
      condition = {
        ...condition,
        id: LessThan(lastMessageId),
      };
    }

    //select
    const result: MessageEntity[] = await this.messageRepository.find({
      where: {
        customerNumber: customerNumber,
        ...condition,
      },
      take: pageSize,
      order: {
        id: 'DESC',
      },
    });
    const response: ApiResponse<MessageEntity[]> = {
      success: true,
      data: result,
      message: 'Success retrieving data from customer number ' + customerNumber,
    };
    return response;
  }
}
