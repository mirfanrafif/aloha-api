import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import {
  MessageEntity,
  MessageStatus,
} from '../../core/repository/message/message.entity';
import { MESSAGE_REPOSITORY } from '../../core/repository/message/message.module';
import { CustomerService } from '../../customer/customer.service';
import { ApiResponse } from '../../utils/apiresponse.dto';
import { WablasAPIException } from '../../utils/wablas.exception';
import { LessThan, Repository } from 'typeorm';
import {
  MessageRequestDto,
  TextMessage,
  MessageType,
  MessageResponseDto,
  DocumentRequestDto,
  MessageTrackingDto,
  ImageMessageRequestDto,
  SendDocumentViaUrlDto,
  BulkMessageRequestDto,
} from '../message.dto';
import { MessageGateway } from '../gateways/message.gateway';
import { Role, UserEntity } from '../../core/repository/user/user.entity';
import { ConversationStatus } from '../../core/repository/conversation/conversation.entity';
import { ConversationService } from './conversation.service';
import { CustomerEntity } from '../../core/repository/customer/customer.entity';
import { UserJobService } from '../../job/user-job.service';
import {
  CustomerAgentArrDto,
  CustomerAgentResponseDto,
} from 'src/customer/customer.dto';
import { UserService } from '../../user/user.service';
import { isEnum } from 'class-validator';
import { WablasService } from '../../core/wablas/wablas.service';
import { MessageHelper } from '../helper/message.helper';

import {
  MessageResponseItem,
  SendDocumentResponse,
  SendImageVideoResponse,
  SendMessageResponseData,
  WablasApiResponse,
  WablasSendDocumentRequest,
  WablasSendImageRequest,
  WablasSendMessageRequest,
  WablasSendVideoRequest,
} from '../../core/wablas/wablas.dto';
import { CustomerCrmService } from '../../core/pukapuka/customer-crm.service';
import { convertPhoneNumber } from '../../core/pukapuka/customer.helper';

const pageSize = 20;

@Injectable()
export class MessageService {
  constructor(
    private gateway: MessageGateway,
    @Inject(MESSAGE_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private customerService: CustomerService,
    private conversationService: ConversationService,
    private userJobService: UserJobService,
    private userService: UserService,
    private wablasService: WablasService,
    private messageHelper: MessageHelper,
    private customerCrmService: CustomerCrmService,
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

    const response = await this.messageHelper.mapMessageEntityToResponse(data);
    await this.gateway.sendMessage({ data: response });

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
        'Halo dengan Raja Dinar. Apakah ada yang bisa kami bantu?\n' +
        jobs +
        '\n*Tulis angkanya saja';
      //kirim pesan pertama ke customer
      this.sendMessageToCustomer({
        messageRequest: {
          customerNumber: data.customer.phoneNumber,
          message: helloMessage,
        },
        customer: customer,
        agent: aloha,
      }).then((value) => value.subscribe());
      //mulai conversation
      await this.conversationService.startConversation(data.customer);

      return this.sendIncomingMessageResponse(data);
    }
    //jika sudah mulai percakapan maka pilih menu
    if (currentConversation.status === ConversationStatus.STARTED) {
      //cek apakah pilihan sudah benar
      const findPilihan = /\d+/gi.test(data.message);
      if (findPilihan === false) {
        // jika pilihan tidak benar, maka kirim mohon pilih menu diatas
        // console.log('mohon pilih menu diatas');
        this.sendMessageToCustomer({
          messageRequest: {
            customerNumber: data.customer.phoneNumber,
            message: 'Mohon pilih menu diatas',
          },
          customer: customer,
          agent: aloha,
        }).then((value) => {
          value.subscribe();
        });

        return this.sendIncomingMessageResponse(data);
      }

      //dapatkan pilihan
      const pilihan = Number.parseInt(data.message);

      //cek apakah ada job yang sesuai
      const pilihanSesuai = await this.userJobService.cekJobSesuai(pilihan);

      //jika sesuai maka arahkan customer ke agent yang sedia
      if (pilihanSesuai === undefined) {
        this.sendMessageToCustomer({
          messageRequest: {
            customerNumber: data.customer.phoneNumber,
            message: 'Mohon pilih menu diatas',
          },
          customer: customer,
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
          customer: customer,
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
        customer: customer,
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
    if (!isEnum(body.status, MessageStatus)) {
      throw new BadRequestException('Wrong type of message status');
    }
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
    const response = this.messageHelper.mapMessageEntityToResponse(
      await this.messageRepository.save(message),
    );

    await this.gateway.sendMessage({ data: response });
    return {
      success: true,
      data: response,
      message: 'Succesfully update message status',
    };
  }

  private async sendIncomingMessageResponse(data: MessageEntity) {
    const response = this.messageHelper.mapMessageEntityToResponse(data);
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

    let filename = '';
    //define file url from wablas
    if (message.messageType != MessageType.text) {
      const timestamp = Date.now().toString();
      filename = timestamp + '-' + message.file;

      filename = await this.wablasService.getFile(message, filename);
    }

    //create entity
    const messageEntity = this.messageRepository.create({
      customer: customer,
      message: messageFiltered !== null ? messageFiltered[1] : message.message,
      messageId: message.id,
      agent: agent,
      status: MessageStatus.RECEIVED,
      fromMe: false,
      file: message.file.length > 0 ? filename : undefined,
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
    const newCustomer =
      customer !== undefined
        ? customer
        : await this.customerService.searchCustomerWithPhoneNumber(
            messageRequest.customerNumber,
          );

    //templating request
    const request: WablasSendMessageRequest = {
      data: [
        {
          phone: newCustomer.phoneNumber,
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
    return this.wablasService.sendMessage(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
        ) => {
          //save ke database
          const messages = await this.saveOutgoingMessage({
            messageResponses: response.data.data,
            customer: newCustomer,
            agent: agent,
          });

          //kirim ke frontend lewat websocket
          const messageResponses = await Promise.all(
            messages.map(async (message: MessageEntity) => {
              const response =
                this.messageHelper.mapMessageEntityToResponse(message);
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

  //kirim pesan ke customer
  async sendBulkMessage({
    bulkMessageRequest,
    agent,
  }: {
    bulkMessageRequest: BulkMessageRequestDto;
    agent: UserEntity;
  }) {
    //phone number no duplicate / map
    const phoneNumberMap = bulkMessageRequest.messages
      .map((message) => {
        return message.customerNumber;
      })
      .reduce((map, obj) => {
        map[obj] = obj;
        return map;
      }, {} as { [key: string]: string });
    const phoneNumberList = Object.keys(phoneNumberMap);

    //find customer from crm with those numbers
    const customerList = await lastValueFrom(
      this.customerCrmService.findWithPhoneNumberList(phoneNumberList),
    );

    //templating request
    const request: WablasSendMessageRequest = {
      data: await Promise.all(
        bulkMessageRequest.messages
          .filter(
            (value) =>
              customerList.findIndex(
                (item) =>
                  item.phoneNumber === convertPhoneNumber(value.customerNumber),
              ) !== -1,
          )
          .map(async (message) => {
            const customer = customerList.find(
              (item) =>
                item.phoneNumber === convertPhoneNumber(message.customerNumber),
            );
            if (customer === undefined) {
              throw new NotFoundException(
                `Nomor handphone ${message.customerNumber} tidak ditemukan`,
              );
            }
            return {
              message: message.message,
              isGroup: false,
              phone: customer.phoneNumber,
              retry: true,
              secret: false,
            };
          }),
      ),
    };

    //buat request ke WABLAS API
    return this.wablasService.sendMessage(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
        ) => {
          //save ke database
          const messages = await Promise.all(
            response.data.data.messages.map((item) => {
              return this.saveOutgoingBulkMessage({
                messageItem: item,
                agent: agent,
                customerList: customerList,
              });
            }),
          );

          //kirim ke frontend lewat websocket
          const messageResponses = await Promise.all(
            messages.map(async (message: MessageEntity) => {
              const response =
                this.messageHelper.mapMessageEntityToResponse(message);
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
    const customer = await this.customerService.searchCustomerWithPhoneNumber(
      body.customerNumber,
    );

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

    //buat request ke WABLAS API
    return this.wablasService.sendImage(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendImageVideoResponse>>,
        ) => {
          if (!response.data.status) {
            throw new WablasAPIException(response.data.message);
          }

          //save ke database
          const messages = await this.saveOutgoingImageVideoMessage({
            messageResponses: response.data.data,
            agent: agent,
            customer: customer,
            filename: process.env.BASE_URL + '/message/image/' + file.filename,
            type: MessageType.image,
          });

          //kirim ke frontend lewat websocket
          const messageResponse = await Promise.all(
            messages.map(async (message: MessageEntity) => {
              const response =
                this.messageHelper.mapMessageEntityToResponse(message);
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
          throw new WablasAPIException(value.response.data.message);
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
    const customer = await this.customerService.searchCustomerWithPhoneNumber(
      body.customerNumber,
    );

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

    //buat request ke WABLAS API
    return this.wablasService.sendVideo(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendImageVideoResponse>>,
        ) => {
          //save ke database
          const messages = await this.saveOutgoingImageVideoMessage({
            messageResponses: response.data.data,
            customer: customer,
            agent: agent,
            filename: process.env.BASE_URL + '/message/video/' + file.filename,
            type: MessageType.video,
          });

          //kirim ke frontend lewat websocket
          const messageResponse = await Promise.all(
            messages.map(async (message: MessageEntity) => {
              const response =
                this.messageHelper.mapMessageEntityToResponse(message);
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
    const customer = await this.customerService.searchCustomerWithPhoneNumber(
      body.customerNumber,
    );

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
    return this.wablasService.sendDocument(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendDocumentResponse>>,
        ) => {
          //save ke database
          const messages = await this.saveOutgoingDocumentMessage({
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
              const response =
                this.messageHelper.mapMessageEntityToResponse(message);
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
    const customer = await this.customerService.searchCustomerWithPhoneNumber(
      body.customerNumber,
    );

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
    return this.wablasService.sendDocument(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendDocumentResponse>>,
        ) => {
          //save ke database
          const messages = await this.saveOutgoingDocumentMessage({
            messageResponses: response.data.data,
            agent: agent,
            filename: body.url,
            customer: customer,
            type: MessageType.document,
          });

          //kirim ke frontend lewat websocket
          const messageResponse = await Promise.all(
            messages.map(async (message: MessageEntity) => {
              const response =
                this.messageHelper.mapMessageEntityToResponse(message);
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
  private async saveOutgoingMessage({
    messageResponses,
    customer,
    agent,
  }: {
    messageResponses: SendMessageResponseData;
    customer: CustomerEntity;
    agent?: UserEntity;
  }): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    //for loop insert data
    for (const messageItem of messageResponses.messages) {
      let message = this.messageRepository.create({
        messageId: messageItem.id,
        message: messageItem.message,
        customer: customer,
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

  //simpan pesan keluar
  private async saveOutgoingBulkMessage({
    messageItem,
    customerList,
    agent,
  }: {
    messageItem: MessageResponseItem;
    customerList: CustomerEntity[];
    agent?: UserEntity;
  }): Promise<MessageEntity> {
    const customer = customerList.find(
      (item) => item.phoneNumber === messageItem.phone,
    );

    if (customer === undefined) {
      throw new BadRequestException(
        'Customer with number ' + messageItem.phone,
      );
    }

    const message = this.messageRepository.save({
      messageId: messageItem.id,
      message: messageItem.message,
      customer: customer,
      agent: agent,
      status: messageItem.status,
      fromMe: true,
      type: MessageType.text,
    });
    return message;
  }

  //simpan pesan dokumen keluar
  private async saveOutgoingImageVideoMessage({
    messageResponses,
    customer,
    agent,
    filename,
    type,
  }: {
    messageResponses: SendImageVideoResponse;
    customer: CustomerEntity;
    agent?: UserEntity;
    filename: string;
    type: MessageType;
  }): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    //for loop insert data
    for (const messageItem of messageResponses.messages) {
      const message = await this.messageRepository.save({
        messageId: messageItem.id,
        message: messageItem.caption ?? '',
        customer: customer,
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

  //simpan pesan dokumen keluar
  private async saveOutgoingDocumentMessage({
    messageResponses,
    customer,
    agent,
    filename,
    type,
  }: {
    messageResponses: SendDocumentResponse;
    customer: CustomerEntity;
    agent?: UserEntity;
    filename: string;
    type: MessageType;
  }): Promise<MessageEntity[]> {
    const messages: MessageEntity[] = [];

    //for loop insert data
    for (const messageItem of messageResponses.messages) {
      const message = await this.messageRepository.save({
        messageId: messageItem.id,
        message: '',
        customer: customer,
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
      withDeleted: true,
    });

    const messageResponse = result.map((messageItem) => {
      return this.messageHelper.mapMessageEntityToResponse(messageItem);
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
    const customer = await this.customerService.searchCustomerByName({
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
            ? this.messageHelper.mapMessageEntityToResponse(messages[0])
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
    ).catch((err) => {
      console.log(err);
      return [];
    });
    return result;
  }

  private findUnreadMessage(messages: MessageEntity[]) {
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
