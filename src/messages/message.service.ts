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
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import {
  WablasApiResponse,
  MessageRequestDto,
  SendMessageResponseData,
  TextMessage,
  MessageType,
  WablasSendMessageRequest,
  BroadcastMessageRequest,
  WablasSendMessageRequestData,
} from './message.dto';
import { MessageGateway } from './message.gateway';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { CONVERSATION_REPOSITORY } from 'src/core/repository/conversation/conversation-repository.module';
import {
  ConversationEntity,
  ConversationStatus,
} from 'src/core/repository/conversation/conversation.entity';
import { ConversationService } from './conversation.service';

const pageSize = 20;

@Injectable()
export class MessageService {
  constructor(
    private http: HttpService,
    private gateway: MessageGateway,
    @Inject(MESSAGE_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private customerService: CustomerService,
    @Inject(USER_JOB_REPOSITORY)
    private userJobRepository: Repository<UserJobEntity>,

    private conversationService: ConversationService,
  ) {}

  async handleIncomingMessage(incomingMessage: TextMessage) {
    //message from group
    if (incomingMessage.isGroup) {
      throw new HttpException(
        'Failed to handle incoming message. Message is from group',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await this.saveIncomingMessage(incomingMessage);

    console.log(data);

    //cek apakah sudah ada percakapan sebelumnya
    const currentConversation =
      await this.conversationService.getCurrentConversationSession(
        data.customerNumber,
      );

    // jika belum maka mulai percakapan
    if (currentConversation === undefined) {
      //tampilkan menu
      const jobs = await this.showMenu();
      const helloMessage =
        'Halo dengan Raja Dinar. Apakah ada yang bisa kami bantu?\n' + jobs;
      //kirim pesan pertama ke customer
      this.sendMessageToCustomer({
        customerNumber: data.customerNumber,
        message: helloMessage,
      }).then((value) => {
        value.subscribe();
      });
      //mulai conversation
      await this.conversationService.startConversation(data.customerNumber);
    } else if (currentConversation.status === ConversationStatus.STARTED) {
      //cek apakah pilihan sudah benar
      const findPilihan = /\d/gi.exec(incomingMessage.message);
      if (findPilihan === null) {
        //jika pilihan tidak benar, maka kirim mohon pilih menu diatas
        this.sendMessageToCustomer({
          customerNumber: data.customerNumber,
          message: 'Mohon pilih menu diatas',
        }).then((value) => {
          value.subscribe();
        });
      } else {
        //dapatkan pilihan
        const pilihan = Number.parseInt(findPilihan[0]);

        //cek apakah ada job yang sesuai
        const userJobs = await this.userJobRepository.find();
        const pilihanSesuai = userJobs.map((job) => job.id).includes(pilihan);

        //jika sesuai maka arahkan customer ke agent yang sedia
        if (pilihanSesuai) {
          //ubah status jadi connected
          await this.conversationService.connectConversation(
            currentConversation,
          );
          //delegasikan customer ke agent yang sesuai
          const customerAgent =
            await this.customerService.assignCustomerToAgent({
              customerNumber: data.customerNumber,
              agentJob: pilihan,
            });
          data.agent = customerAgent.agent;
          //kirim pesan bahwa akan terhubung
          await this.sendMessageToCustomer({
            customerNumber: data.customerNumber,
            message:
              'Sebentar lagi anda akan terhubung dengan customer service kami, ' +
              customerAgent.agent.full_name +
              '. Mohon tunggu sebentar',
          }).then((value) => {
            value.subscribe();
          });
        }
      }
    } else if (currentConversation.status === ConversationStatus.CONNECTED) {
      //jika sudah terhubung, maka langsung chat ke agent
      //find agent by customer
      const customerAgent =
        await this.customerService.findAgentByCustomerNumber({
          customerNumber: incomingMessage.phone,
        });

      if (customerAgent !== undefined) {
        //update message data
        data.agent = customerAgent.agent;
        await this.messageRepository.save(data);
      }
    }

    //send to frontend via websocket
    this.gateway.sendMessage(data);
    return {
      success: true,
      message: 'Success catch data from Wablas API',
      data: data,
    };
  }

  //save pesan ke database
  async saveIncomingMessage(message: TextMessage, agent?: UserEntity) {
    const messageFiltered = /<~ (.*)/gi.exec(message.message);

    //create entity
    const messageEntity = this.messageRepository.create({
      customerNumber: message.phone,
      message: messageFiltered !== null ? messageFiltered[1] : message.message,
      messageId: message.id,
      agent: agent,
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

    return data;
  }

  //kirim pesan ke customer
  async sendMessageToCustomer(
    messageRequest: MessageRequestDto,
    agent?: UserEntity,
  ) {
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

    if (agent !== undefined) {
      //jika role admin tidak perlu cek ini
      if (agent.role !== Role.admin) {
        //cek apakah agent handle customer. jika tidak throw Httpexception
        await this.customerService.agentShouldHandleCustomer({
          customerNumber: messageRequest.customerNumber,
          agent: agent,
        });
      }
    }

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

  //broadcast pesan ke customer
  async broadcastMessageToCustomer(
    body: BroadcastMessageRequest,
    agent: UserEntity,
  ) {
    //templating request
    const messages = body.messages.map<WablasSendMessageRequestData>(
      (item) => ({
        phone: item.customerNumber,
        message: item.message,
        isGroup: false,
        retry: false,
        secret: false,
      }),
    );
    const request: WablasSendMessageRequest = {
      data: messages,
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

  //simpan pesan keluar
  async saveOutgoingMessage(
    messageResponses: SendMessageResponseData,
    agent?: UserEntity,
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

  //dapatkan pesan sebelumnya berdasarkan customer number
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

  //cari customer by user id / list pesan
  async getCustomerByAgentId(user: UserEntity, lastCustomerId?: number) {
    const messages = await this.customerService.getCustomerByAgent({
      agent: user,
      lastCustomerId,
    });
    const result: ApiResponse<CustomerAgent[]> = {
      success: true,
      data: messages,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  //tampilkan menu
  async showMenu() {
    const userJobs = await this.userJobRepository.find();
    return userJobs
      .map((job) => {
        return `${job.id}. ${job.name}`;
      })
      .join('\n');
  }
}
