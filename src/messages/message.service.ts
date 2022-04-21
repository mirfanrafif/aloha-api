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
  MessageResponseDto,
  WablasSendImageRequest,
  SendImageResponseData,
  DocumentRequestDto,
  WablasSendDocumentRequest,
  MessageTrackingDto,
  WablasSendVideoRequest,
  ImageMessageRequestDto,
  SendVideoResponseData,
  SendDocumentViaUrlDto,
} from './message.dto';
import { MessageGateway } from './message.gateway';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { ConversationStatus } from 'src/core/repository/conversation/conversation.entity';
import { ConversationService } from './conversation.service';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { UserJobService } from 'src/job/user-job.service';
import {
  CustomerAgentArrDto,
  CustomerAgentResponseDto,
} from 'src/customer/customer.dto';
import { UserService } from 'src/user/user.service';

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
    private userService: UserService,
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
      await this.customerService.findOrCreateCustomer({
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

    const aloha = await this.userService.getAloha();

    // jika belum maka mulai percakapan
    if (currentConversation === null) {
      //tampilkan menu
      const jobs = await this.userJobService.showMenu();
      const helloMessage =
        'Halo dengan Raja Dinar. Apakah ada yang bisa kami bantu?\n' + jobs;
      //kirim pesan pertama ke customer
      this.sendMessageToCustomer({
        messageRequest: {
          customerNumber: data.customer.phoneNumber,
          message: helloMessage,
        },
        agent: aloha,
      }).then((value) => value.subscribe());
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
          messageRequest: {
            customerNumber: data.customer.phoneNumber,
            message: 'Mohon pilih menu diatas',
          },
          agent: aloha,
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
          messageRequest: {
            customerNumber: data.customer.phoneNumber,
            message: 'Mohon pilih menu diatas',
          },
          agent: aloha,
        }).then((value) => {
          value.subscribe();
        });

        return this.sendIncomingMessageResponse(data);
      }

      //cek apakah ada cs yang bekerja di layanan itu
      if (pilihanSesuai.job.agents.length == 0) {
        await this.sendMessageToCustomer({
          messageRequest: {
            customerNumber: data.customer.phoneNumber,
            message:
              'Mohon maaf tidak ada customer service yang dapat melayani di bidang tersebut',
          },
          agent: aloha,
        }).then((value) => {
          value.subscribe();
        });

        return this.sendIncomingMessageResponse(data);
      }

      //delegasikan customer ke agent yang sesuai
      const customerAgent = await this.customerService.assignCustomerToAgent({
        customer: customer,
        agentJob: pilihanSesuai.job.id,
      });

      //ubah status jadi connected
      await this.conversationService.connectConversation(currentConversation);
      //kirim pesan bahwa akan terhubung
      await this.sendMessageToCustomer({
        messageRequest: {
          customerNumber: data.customer.phoneNumber,
          message:
            'Sebentar lagi anda akan terhubung dengan sales kami, ' +
            customerAgent.agent.full_name +
            '. Mohon tunggu sebentar',
        },
        agent: aloha,
      }).then((value) => {
        value.subscribe();
      });

      return this.sendIncomingMessageResponse(data);
    }
    if (currentConversation.status === ConversationStatus.CONNECTED) {
      return this.sendIncomingMessageResponse(data);
    }
  }

  async updateMessageStatus(
    body: MessageTrackingDto,
  ): Promise<ApiResponse<MessageResponseDto>> {
    console.log(body);
    const message = await this.messageRepository.findOneOrFail({
      where: {
        messageId: body.id,
      },
      relations: {
        agent: true,
        customer: true,
      },
    });
    message.status = body.status;
    const response = this.mapMessageEntityToResponse(
      await this.messageRepository.save(message),
    );

    await this.gateway.sendMessage({ data: response });
    return {
      success: true,
      data: response,
      message: 'Succesfully update message status',
    };
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

  async sendIncomingMessageResponse(data: MessageEntity) {
    const response = this.mapMessageEntityToResponse(data);
    await this.gateway.sendMessage({ data: response });
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

    let fileUrl = '';

    switch (message.messageType) {
      case MessageType.video:
        fileUrl = 'https://solo.wablas.com/video/' + message.file;
        break;
      case MessageType.image:
        fileUrl = 'https://solo.wablas.com/image/' + message.file;
        break;
      case MessageType.document:
        fileUrl = 'https://solo.wablas.com/document/' + message.file;
        break;
      default:
        break;
    }

    //create entity
    const messageEntity = this.messageRepository.create({
      customer: customer,
      message: messageFiltered !== null ? messageFiltered[1] : message.message,
      messageId: message.id,
      agent: agent,
      status: MessageStatus.RECEIVED,
      fromMe: false,
      file: message.file.length > 0 ? fileUrl : undefined,
      type: message.messageType,
    });

    //save entity
    const data: MessageEntity = await this.messageRepository.save(
      messageEntity,
    );

    return data;
  }

  //kirim pesan ke customer
  async sendMessageToCustomer({
    messageRequest,
    agent,
    customer,
  }: {
    messageRequest: MessageRequestDto;
    agent?: UserEntity;
    customer?: CustomerEntity;
  }) {
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
      if (agent.role === Role.agent) {
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
            console.log(response.data);

            //save ke database
            const messages = await this.saveOutgoingMessage({
              messageResponses: response.data.data,
              customer: customer,
              agent: agent,
            });

            //kirim ke frontend lewat websocket
            const messageResponses = await Promise.all(
              messages.map(async (message: MessageEntity) => {
                const response = this.mapMessageEntityToResponse(message);
                await this.gateway.sendMessage({ data: response });
                return response;
              }),
            );

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
          console.log(value.response);
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

  //kirim gambar ke customer
  async sendImageToCustomer(
    file: Express.Multer.File,
    body: MessageRequestDto,
    agent: UserEntity,
  ) {
    // const fileType = /image\/(.*)/gi.exec(file.mimetype);
    // if (fileType === null) {
    //   throw new BadRequestException();
    // }

    const customer = await this.customerService.findCustomer({
      phoneNumber: body.customerNumber,
    });

    //templating request
    const request: WablasSendImageRequest = {
      data: [
        {
          phone: customer.phoneNumber,
          image: process.env.BASE_URL + '/message/image/' + file.filename,
          caption: body.message,
          isGroup: false,
          retry: false,
          secret: false,
        },
      ],
    };

    console.log(request);

    //buat request ke WABLAS API
    return this.http
      .post('/api/v2/send-image', JSON.stringify(request), {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .pipe(
        map(
          async (
            response: AxiosResponse<WablasApiResponse<SendImageResponseData>>,
          ) => {
            //save ke database
            const messages = await this.saveOutgoingMessageWithAttachment({
              messageResponses: response.data.data,
              agent: agent,
              customer: customer,
              filename:
                process.env.BASE_URL + '/message/image/' + file.filename,
              type: MessageType.image,
            });

            //kirim ke frontend lewat websocket
            const messageResponse = await Promise.all(
              messages.map(async (message: MessageEntity) => {
                const response = this.mapMessageEntityToResponse(message);
                await this.gateway.sendMessage({ data: response });
                return response;
              }),
            );

            //return result
            const result: ApiResponse<MessageEntity[]> = {
              success: true,
              data: messageResponse,
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

  //kirim gambar ke customer
  async sendVideoToCustomer(
    file: Express.Multer.File,
    body: ImageMessageRequestDto,
    agent: UserEntity,
  ) {
    const customer = await this.customerService.findCustomer({
      phoneNumber: body.customerNumber,
    });

    //templating request
    const request: WablasSendVideoRequest = {
      data: [
        {
          phone: customer.phoneNumber,
          video: process.env.BASE_URL + '/message/video/' + file.filename,
          caption: body.message,
          isGroup: false,
          retry: false,
          secret: false,
        },
      ],
    };

    console.log(request);

    //buat request ke WABLAS API
    return this.http
      .post('/api/v2/send-video', JSON.stringify(request), {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .pipe(
        map(
          async (
            response: AxiosResponse<WablasApiResponse<SendVideoResponseData>>,
          ) => {
            //save ke database
            const messages = await this.saveOutgoingMessageWithAttachment({
              messageResponses: response.data.data,
              customer: customer,
              agent: agent,
              filename:
                process.env.BASE_URL + '/message/video/' + file.filename,
              type: MessageType.video,
            });

            //kirim ke frontend lewat websocket
            const messageResponse = await Promise.all(
              messages.map(async (message: MessageEntity) => {
                const response = this.mapMessageEntityToResponse(message);
                await this.gateway.sendMessage({ data: response });
                return response;
              }),
            );

            //return result
            const result: ApiResponse<MessageEntity[]> = {
              success: true,
              data: messageResponse,
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

  //kirim gambar ke customer
  async sendDocumentToCustomer(
    file: Express.Multer.File,
    body: DocumentRequestDto,
    agent: UserEntity,
  ) {
    const customer = await this.customerService.findCustomer({
      phoneNumber: body.customerNumber,
    });

    //templating request
    const request: WablasSendDocumentRequest = {
      data: [
        {
          phone: customer.phoneNumber,
          document: process.env.BASE_URL + '/message/document/' + file.filename,
          isGroup: false,
          retry: false,
          secret: false,
        },
      ],
    };

    //buat request ke WABLAS API
    return this.http
      .post('/api/v2/send-document', JSON.stringify(request), {
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
            const messages = await this.saveOutgoingMessageWithAttachment({
              messageResponses: response.data.data,
              agent: agent,
              filename:
                process.env.BASE_URL + '/message/document/' + file.filename,
              customer: customer,
              type: MessageType.document,
            });

            //kirim ke frontend lewat websocket
            const messageResponse = await Promise.all(
              messages.map(async (message: MessageEntity) => {
                const response = this.mapMessageEntityToResponse(message);
                await this.gateway.sendMessage({ data: response });
                return response;
              }),
            );

            //return result
            const result: ApiResponse<MessageEntity[]> = {
              success: true,
              data: messageResponse,
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

  //kirim gambar ke customer
  async sendDocumentToCustomerViaUrl(
    body: SendDocumentViaUrlDto,
    agent: UserEntity,
  ) {
    const customer = await this.customerService.findCustomer({
      phoneNumber: body.customerNumber,
    });

    //templating request
    const request: WablasSendDocumentRequest = {
      data: [
        {
          phone: customer.phoneNumber,
          document: body.url,
          isGroup: false,
          retry: false,
          secret: false,
        },
      ],
    };

    //buat request ke WABLAS API
    return this.http
      .post('/api/v2/send-document', JSON.stringify(request), {
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
            const messages = await this.saveOutgoingMessageWithAttachment({
              messageResponses: response.data.data,
              agent: agent,
              filename: body.url,
              customer: customer,
              type: MessageType.document,
            });

            //kirim ke frontend lewat websocket
            const messageResponse = await Promise.all(
              messages.map(async (message: MessageEntity) => {
                const response = this.mapMessageEntityToResponse(message);
                await this.gateway.sendMessage({ data: response });
                return response;
              }),
            );

            //return result
            const result: ApiResponse<MessageEntity[]> = {
              success: true,
              data: messageResponse,
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
          : await this.customerService.findOrCreateCustomer({
              phoneNumber: messageItem.phone,
            });
      let message = this.messageRepository.create({
        messageId: messageItem.id,
        message: messageItem.message,
        customer: newCustomer,
        agent: agent,
        status: messageItem.status,
        fromMe: true,
        type: MessageType.text,
      });
      message = await this.messageRepository.save(message);
      messages.push(message);
    }

    return messages;
  }

  //simpan pesan dokumen keluar
  async saveOutgoingMessageWithAttachment({
    messageResponses,
    customer,
    agent,
    filename,
    type,
  }: {
    messageResponses: SendMessageResponseData;
    customer?: CustomerEntity;
    agent?: UserEntity;
    filename: string;
    type: MessageType;
  }): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    //for loop insert data
    for (const messageItem of messageResponses.messages) {
      const newCustomer =
        customer !== undefined
          ? customer
          : await this.customerService.findOrCreateCustomer({
              phoneNumber: messageItem.phone,
            });
      const message = await this.messageRepository.save({
        messageId: messageItem.id,
        message: '',
        customer: newCustomer,
        file: filename,
        agent: agent,
        status: messageItem.status,
        fromMe: true,
        type: type,
      });
      messages.push(message);
    }

    return messages;
  }

  // //simpan pesan dokumen keluar
  // async saveOutgoingVideoMessage({
  //   messageResponses,
  //   customer,
  //   agent,
  //   filename,
  // }: {
  //   messageResponses: SendVideoResponseData;
  //   customer?: CustomerEntity;
  //   agent?: UserEntity;
  //   filename: string;
  // }): Promise<MessageEntity[]> {
  //   const messages: MessageEntity[] = [];

  //   //for loop insert data
  //   for (const messageItem of messageResponses.messages) {
  //     const newCustomer =
  //       customer !== undefined
  //         ? customer
  //         : await this.customerService.findOrCreateCustomer({
  //             phoneNumber: messageItem.phone,
  //           });
  //     const message = await this.messageRepository.save({
  //       messageId: messageItem.id,
  //       message: messageItem.caption,
  //       customer: newCustomer,
  //       file: filename,
  //       agent: agent,
  //       status: messageItem.status,
  //       fromMe: true,
  //       type: MessageType.video,
  //     });
  //     messages.push(message);
  //   }

  //   return messages;
  // }

  // //simpan pesan gambar keluar
  // async saveOutgoingImageMessage({
  //   messageResponses,
  //   customer,
  //   agent,
  //   filename,
  // }: {
  //   messageResponses: SendImageResponseData;
  //   customer?: CustomerEntity;
  //   agent?: UserEntity;
  //   filename: string;
  // }): Promise<MessageEntity[]> {
  //   const messages: MessageEntity[] = [];

  //   //for loop insert data
  //   for (const messageItem of messageResponses.messages) {
  //     const newCustomer =
  //       customer !== undefined
  //         ? customer
  //         : await this.customerService.findOrCreateCustomer({
  //             phoneNumber: messageItem.phone,
  //           });
  //     const message = await this.messageRepository.save({
  //       messageId: messageItem.id,
  //       message: messageItem.caption,
  //       file: filename,
  //       customer: newCustomer,
  //       agent: agent,
  //       status: messageItem.status,
  //       fromMe: true,
  //       type: MessageType.image,
  //     });
  //     messages.push(message);
  //   }

  //   return messages;
  // }

  //dapatkan pesan sebelumnya berdasarkan customer number
  async getPastMessageByCustomerId(customerId: number, lastMessageId: number) {
    let condition = {};
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
      relations: {
        agent: true,
        customer: true,
      },
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
  async getMessageByAgentId(user: UserEntity) {
    const messages = await this.customerService.getCustomerByAgent({
      agent: user,
    });

    const customerWithLastMessage = await this.findLastMessage(messages);

    const result = {
      success: true,
      data: customerWithLastMessage,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  async searchCustomer(name: string, user: UserEntity) {
    const customer = await this.customerService.searchCustomer({
      agent: user,
      name: name,
    });
    const customerWithLastMessage = await this.findLastMessage(customer);
    const result = {
      success: true,
      data: customerWithLastMessage,
      message: `Success searching customer with phone number ${name}`,
    };
    return result;
  }

  //cari pesan terakhir
  async findLastMessage(
    listCustomer: CustomerAgentArrDto[],
  ): Promise<CustomerAgentResponseDto[]> {
    const result = await Promise.all(
      listCustomer.map(async (customerAgent) => {
        const messages = await this.messageRepository.find({
          where: {
            customer: {
              id: customerAgent.customer.id,
            },
          },
          order: {
            id: 'DESC',
          },
          relations: {
            customer: true,
            agent: true,
          },
          take: 10,
        });

        const lastMessageResponse =
          messages != null && messages.length > 0
            ? this.mapMessageEntityToResponse(messages[0])
            : null;

        const newCustomer: CustomerAgentResponseDto = {
          id: customerAgent.id,
          customer: customerAgent.customer,
          agent: customerAgent.agent,
          unread: this.findUnreadMessage(messages),
          lastMessage: lastMessageResponse,
          created_at: customerAgent.created_at,
          updated_at: customerAgent.updated_at,
        };
        return newCustomer;
      }),
    );
    return result;
  }

  findUnreadMessage(messages: MessageEntity[]) {
    let count = 0;
    for (const message of messages) {
      if (!message.fromMe) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}
