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
  BroadcastMessageRequest,
  WablasSendMessageRequestData,
  MessageResponseDto,
} from './message.dto';
import { MessageGateway } from './message.gateway';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { ConversationStatus } from 'src/core/repository/conversation/conversation.entity';
import { ConversationService } from './conversation.service';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { UserJobService } from 'src/user-job/user-job.service';
import {
  CustomerAgentArrDto,
  CustomerAgentResponseDto,
} from 'src/customer/customer.dto';

const pageSize = 20;

@Injectable()
export class MessageService {
  constructor(
    private http: HttpService,
    private gateway: MessageGateway,
    @Inject(MESSAGE_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private customerService: CustomerService,
    private conversationService: ConversationService,
    private userJobService: UserJobService,
  ) {}

  async handleIncomingMessage(incomingMessage: TextMessage) {
    //message from group
    if (incomingMessage.isGroup) {
      throw new HttpException(
        'Failed to handle incoming message. Message is from group',
        HttpStatus.BAD_REQUEST,
      );
    }

    //cari customer, kalau tidak ada maka simpan baru di database
    const customer: CustomerEntity =
      await this.customerService.findAndCreateCustomer({
        phoneNumber: incomingMessage.phone,
        name: incomingMessage.pushName,
      });

    //simpan pesan ke database
    const data = await this.saveIncomingMessage({
      message: incomingMessage,
      customer: customer,
    });

    //cek apakah sudah ada percakapan sebelumnya
    const currentConversation =
      await this.conversationService.getCurrentConversationSession(
        data.customer,
      );

    // jika belum maka mulai percakapan
    if (currentConversation === undefined) {
      //tampilkan menu
      const jobs = await this.userJobService.showMenu();
      const helloMessage =
        'Halo dengan Raja Dinar. Apakah ada yang bisa kami bantu?\n' + jobs;
      //kirim pesan pertama ke customer
      this.sendMessageToCustomer({
        customerNumber: data.customer.phoneNumber,
        message: helloMessage,
      }).then((value) => {
        value.subscribe();
      });
      //mulai conversation
      await this.conversationService.startConversation(data.customer);

      return this.sendIncomingMessageResponse(data);
    }
    //jika sudah mulai percakapan maka pilih menu
    if (currentConversation.status === ConversationStatus.STARTED) {
      //cek apakah pilihan sudah benar
      const findPilihan = /\d/gi.exec(data.message);
      if (findPilihan === null) {
        //jika pilihan tidak benar, maka kirim mohon pilih menu diatas
        this.sendMessageToCustomer({
          customerNumber: data.customer.phoneNumber,
          message: 'Mohon pilih menu diatas',
        }).then((value) => {
          value.subscribe();
        });

        return this.sendIncomingMessageResponse(data);
      }

      //dapatkan pilihan
      const pilihan = Number.parseInt(findPilihan[0]);

      //cek apakah ada job yang sesuai
      const pilihanSesuai = await this.userJobService.cekJobSesuai(pilihan);

      //jika sesuai maka arahkan customer ke agent yang sedia
      if (pilihanSesuai === undefined) {
        this.sendMessageToCustomer({
          customerNumber: data.customer.phoneNumber,
          message: 'Mohon pilih menu diatas',
        }).then((value) => {
          value.subscribe();
        });

        return this.sendIncomingMessageResponse(data);
      }

      //cek apakah ada cs yang bekerja di layanan itu
      if (pilihanSesuai.agents.length == 0) {
        await this.sendMessageToCustomer({
          customerNumber: data.customer.phoneNumber,
          message:
            'Mohon maaf tidak ada customer service yang dapat melayani di bidang tersebut',
        }).then((value) => {
          value.subscribe();
        });

        return this.sendIncomingMessageResponse(data);
      }

      //delegasikan customer ke agent yang sesuai
      const customerAgent = await this.customerService.assignCustomerToAgent({
        customer: customer,
        agentJob: pilihan,
      });

      //ubah status jadi connected
      await this.conversationService.connectConversation(currentConversation);
      //kirim pesan bahwa akan terhubung
      await this.sendMessageToCustomer({
        customerNumber: data.customer.phoneNumber,
        message:
          'Sebentar lagi anda akan terhubung dengan customer service kami, ' +
          customerAgent.agent.full_name +
          '. Mohon tunggu sebentar',
      }).then((value) => {
        value.subscribe({
          error: (err: WablasAPIException) => {
            console.log(err);
          },
        });
      });

      return this.sendIncomingMessageResponse(data);
    }
    if (currentConversation.status === ConversationStatus.CONNECTED) {
      //jika sudah terhubung, maka langsung chat ke agent
      //find agent by customer
      const customerAgent =
        await this.customerService.findAgentByCustomerNumber({
          customer: customer,
        });

      if (customerAgent !== undefined) {
        //update message data
        data.agent = customerAgent.agent;
        await this.messageRepository.save(data);
      }

      return this.sendIncomingMessageResponse(data);
    }
  }

  mapMessageEntityToResponse(data: MessageEntity) {
    let sender_name: string;
    if (!data.fromMe) {
      sender_name = data.customer.name;
    } else if (data.agent === undefined || data.agent === null) {
      sender_name = 'Sistem';
    } else {
      sender_name = data.agent.full_name;
    }

    //send to frontend via websocket
    const response: MessageResponseDto = {
      id: data.id,
      customer: data.customer,
      fromMe: data.fromMe,
      file: data.file,
      message: data.message,
      agent: data.agent,
      sender_name: sender_name,
      messageId: data.messageId,
      status: data.status,
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
    return response;
  }

  sendIncomingMessageResponse(data: MessageEntity) {
    const response = this.mapMessageEntityToResponse(data);
    this.gateway.sendMessage(response);
    const result: ApiResponse<MessageResponseDto> = {
      success: true,
      message: 'Success catch data from Wablas API',
      data: response,
    };
    return result;
  }

  //save pesan ke database
  async saveIncomingMessage({
    message,
    agent,
    customer,
  }: {
    message: TextMessage;
    agent?: UserEntity;
    customer: CustomerEntity;
  }) {
    const messageFiltered = /<~ (.*)/gi.exec(message.message);

    //create entity
    const messageEntity = this.messageRepository.create({
      customer: customer,
      message: messageFiltered !== null ? messageFiltered[1] : message.message,
      messageId: message.id,
      agent: agent,
      status: MessageStatus.RECEIVED,
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
    customer?: CustomerEntity,
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
            const messages = await this.saveOutgoingMessage({
              messageResponses: response.data.data,
              customer: customer,
              agent: agent,
            });

            //kirim ke frontend lewat websocket
            const messageResponses = messages.map((message: MessageEntity) => {
              const response = this.mapMessageEntityToResponse(message);
              this.gateway.sendMessage(response);
              return response;
            });

            //return result
            const result: ApiResponse<MessageResponseDto[]> = {
              success: true,
              data: messageResponses,
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
          throw new WablasAPIException('Failed to send message to Wablas API');
        }),
      );
  }

  //broadcast pesan ke customer
  async broadcastMessageToCustomer(
    body: BroadcastMessageRequest,
    agent: UserEntity,
  ) {
    const customer = await this.customerService.getAllCustomer();

    //templating request
    const messages = customer.map<WablasSendMessageRequestData>((item) => ({
      phone: item.phoneNumber,
      message: body.message,
      isGroup: false,
      retry: false,
      secret: false,
    }));
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
            const messages = await this.saveOutgoingMessage({
              messageResponses: response.data.data,
              agent: agent,
            });

            //kirim ke frontend lewat websocket
            messages.forEach((message: MessageEntity) => {
              const response = this.mapMessageEntityToResponse(message);
              this.gateway.sendMessage(response);
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
        catchError((value: AxiosError<WablasApiResponse<any>>) => {
          if (value.response !== undefined) {
            throw new WablasAPIException(
              'Failed to send message to Wablas API. Message : ' +
                value.response.data.message,
            );
          }
          throw new WablasAPIException('Failed to send message to Wablas API.');
        }),
      );
  }

  //simpan pesan keluar
  async saveOutgoingMessage({
    messageResponses,
    customer,
    agent,
  }: {
    messageResponses: SendMessageResponseData;
    customer?: CustomerEntity;
    agent?: UserEntity;
  }): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    //for loop insert data
    for (const messageItem of messageResponses.messages) {
      const newCustomer =
        customer !== undefined
          ? customer
          : await this.customerService.findAndCreateCustomer({
              phoneNumber: messageItem.phone,
            });
      const message = await this.messageRepository.save({
        messageId: messageItem.id,
        message: messageItem.message,
        customer: newCustomer,
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
  async getPastMessageByCustomerId(
    customerId: number,
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
        customer: {
          id: customerId,
        },
        ...condition,
      },
      take: pageSize,
      relations: ['agent', 'customer'],
      order: {
        id: 'DESC',
      },
    });

    const messageResponse = result.map((messageItem) => {
      return this.mapMessageEntityToResponse(messageItem);
    });

    const response: ApiResponse<MessageResponseDto[]> = {
      success: true,
      data: messageResponse,
      message: 'Success retrieving data from customer id ' + customerId,
    };
    return response;
  }

  //cari customer by user id / list pesan
  async getCustomerByAgentId(user: UserEntity, lastCustomerId?: number) {
    const messages = await this.customerService.getCustomerByAgent({
      agent: user,
      lastCustomerId,
    });

    const customerWithLastMessage = await this.findLastMessage(messages);

    const result = {
      success: true,
      data: customerWithLastMessage,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  async searchCustomer(customerNumber: string, user: UserEntity) {
    const customer = await this.customerService.searchCustomer({
      agent: user,
      customerNumber: customerNumber,
    });
    const customerWithLastMessage = await this.findLastMessage(customer);
    const result = {
      success: true,
      data: customerWithLastMessage,
      message: `Success searching customer with phone number ${customerNumber}`,
    };
    return result;
  }

  //cari pesan terakhir
  async findLastMessage(
    listCustomer: CustomerAgentArrDto[],
  ): Promise<CustomerAgentResponseDto[]> {
    const result = await Promise.all(
      listCustomer.map(async (customerAgent) => {
        const lastMessage = await this.messageRepository.findOne({
          where: {
            customer: customerAgent.customer,
          },
          order: {
            id: 'DESC',
          },
        });

        const newCustomer: CustomerAgentResponseDto = {
          id: customerAgent.id,
          customer: customerAgent.customer,
          created_at: customerAgent.created_at,
          agent: customerAgent.agent,
          lastMessage: lastMessage,
          updated_at: customerAgent.updated_at,
        };
        return newCustomer;
      }),
    );
    return result;
  }
}
