import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import { isArray } from 'class-validator';
import { map, catchError, lastValueFrom } from 'rxjs';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import {
  MessageEntity,
  MessageStatus,
} from 'src/core/repository/message/message.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { CustomerCrmSearchFilter } from 'src/customer/customer.dto';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { WablasAPIException } from 'src/utils/wablas.exception';
import {
  BroadcastMessageRequest,
  WablasSendMessageRequestData,
  WablasSendMessageRequest,
  WablasApiResponse,
  SendMessageResponseData,
  BroadcastImageMessageRequestDto,
  WablasSendImageRequestData,
  WablasSendImageRequest,
  SendImageResponseData,
  WablasSendDocumentRequestData,
  WablasSendDocumentRequest,
  BroadcastDocumentMessageRequestDto,
  MessageType,
  MessageResponseItem,
  ImageResponseItem,
} from '../message.dto';
import { MessageGateway } from '../message.gateway';
import { MessageService } from '../message.service';

@Injectable()
export class BroadcastMessageService {
  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private http: HttpService,
    private gateway: MessageGateway,
  ) {}

  async getCustomers(
    categories: string[],
    interests: string[],
    types: string[],
    email?: string,
  ) {
    const filter: CustomerCrmSearchFilter = {
      'filter.categories.name':
        categories.length > 0 ? '$in:' + categories.join(',') : undefined,
      'filter.interests.name':
        interests.length > 0 ? '$in:' + interests.join(',') : undefined,
      'filter.types.name':
        types.length > 0 ? '$in:' + types.join(',') : undefined,
      // 'filter.users.email': '$eq:' + email,
    };

    const customer: CustomerEntity[] = await lastValueFrom(
      this.customerService.getCustomerWithFilters(filter),
    );

    if (customer === undefined) {
      throw new InternalServerErrorException(
        'failed to get customer data from crm',
      );
    }

    return customer;
  }

  //broadcast pesan ke customer
  async broadcastMessageToCustomer(
    body: BroadcastMessageRequest,
    agent: UserEntity,
  ) {
    const customer = await this.getCustomers(
      body.categories,
      body.interests,
      body.types,
      agent.email,
    );
    //mapping request
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

    return await this.mockSendBroadcastMessasge(request, agent);

    //buat request ke WABLAS API
    // return this.http
    //   .post('/api/v2/send-message', JSON.stringify(request), {
    //     headers: {
    //       Authorization: `${process.env.WABLAS_TOKEN}`,
    //       'Content-Type': 'application/json',
    //       Accept: 'application/json',
    //     },
    //   })
    //   .pipe(
    //     map(
    //       async (
    //         response: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
    //       ) => {
    //         //save ke database
    //         const messages = await this.messageService.saveOutgoingMessage({
    //           messageResponses: response.data.data,
    //           agent: agent,
    //         });
    //         //kirim ke frontend lewat websocket
    //         for (const message of messages) {
    //           const response =
    //             this.messageService.mapMessageEntityToResponse(message);
    //           await this.gateway.sendMessage({ data: response });
    //         }
    //         //return result
    //         const result: ApiResponse<MessageEntity[]> = {
    //           success: true,
    //           data: messages,
    //           message: 'Success sending message to Wablas API',
    //         };
    //         return result;
    //       },
    //     ),
    //     catchError((value: AxiosError<WablasApiResponse<any>>) => {
    //       if (value.response !== undefined) {
    //         throw new WablasAPIException(
    //           'Failed to send message to Wablas API. Message : ' +
    //             value.response.data.message,
    //         );
    //       }
    //       throw new WablasAPIException('Failed to send message to Wablas API.');
    //     }),
    //   );
  }

  async mockSendBroadcastMessasge(
    request: WablasSendMessageRequest,
    agent: UserEntity,
  ) {
    //mocking
    const messageResponses = request.data.map<MessageResponseItem>((item) => ({
      id: '123',
      phone: item.phone,
      status: MessageStatus.PENDING,
      message: item.message,
    }));

    const messageEntities = await this.messageService.saveOutgoingMessage({
      messageResponses: {
        messages: messageResponses,
      },
      agent: agent,
    });

    //kirim ke frontend lewat websocket
    for (const message of messageEntities) {
      const response = this.messageService.mapMessageEntityToResponse(message);
      await this.gateway.sendMessage({ data: response });
    }
    //return result
    const result: ApiResponse<MessageEntity[]> = {
      success: true,
      data: messageEntities,
      message: 'Success sending message to Wablas API',
    };
    return result;
  }

  //kirim gambar ke customer
  async broadcastImageToCustomer(
    file: Express.Multer.File,
    body: BroadcastImageMessageRequestDto,
    agent: UserEntity,
  ) {
    const categories = this.validateArray(body.categories);
    const interests = this.validateArray(body.interests);
    const types = this.validateArray(body.types);

    const customers = await this.getCustomers(
      categories,
      interests,
      types,
      agent.email,
    );

    const sendImageData: WablasSendImageRequestData[] = customers.map(
      (item) => ({
        phone: item.phoneNumber,
        image: process.env.BASE_URL + '/message/image/' + file.filename,
        caption: body.message,
        isGroup: false,
        retry: false,
        secret: false,
      }),
    );
    //templating request
    const request: WablasSendImageRequest = {
      data: sendImageData,
    };

    return await this.sendMockResponseWithAttachment(request, agent, file);

    // //buat request ke WABLAS API
    // return this.http
    //   .post('/api/v2/send-image', JSON.stringify(request), {
    //     headers: {
    //       Authorization: `${process.env.WABLAS_TOKEN}`,
    //       'Content-Type': 'application/json',
    //       Accept: 'application/json',
    //     },
    //   })
    //   .pipe(
    //     map(
    //       async (
    //         response: AxiosResponse<WablasApiResponse<SendImageResponseData>>,
    //       ) => {
    //         //save ke database
    //         const messages =
    //           await this.messageService.saveOutgoingMessageWithAttachment({
    //             messageResponses: response.data.data,
    //             agent: agent,
    //             filename:
    //               process.env.BASE_URL + '/message/image/' + file.filename,
    //             type: MessageType.image,
    //           });

    //         //kirim ke frontend lewat websocket
    //         const messageResponse = await Promise.all(
    //           messages.map(async (message: MessageEntity) => {
    //             const response =
    //               this.messageService.mapMessageEntityToResponse(message);
    //             await this.gateway.sendMessage({ data: response });
    //             return response;
    //           }),
    //         );

    //         //return result
    //         const result: ApiResponse<MessageEntity[]> = {
    //           success: true,
    //           data: messageResponse,
    //           message: 'Success sending message to Wablas API',
    //         };
    //         return result;
    //       },
    //     ),
    //     catchError((value: AxiosError<WablasApiResponse<any>>) => {
    //       if (value.response !== undefined) {
    //         throw new WablasAPIException(
    //           'Failed to send message to Wablas API. Message : ' +
    //             value.response.data.message,
    //         );
    //       }
    //       throw new WablasAPIException('Failed to send message to Wablas API.');
    //     }),
    //   );
  }

  async sendMockResponseWithAttachment(
    request: WablasSendImageRequest,
    agent: UserEntity,
    file: Express.Multer.File,
  ) {
    const messageResponses = request.data.map<ImageResponseItem>((item) => ({
      id: '123',
      phone: item.phone,
      image: item.image,
      status: MessageStatus.PENDING,
      caption: item.caption ?? '',
    }));

    const messageEntities =
      await this.messageService.saveOutgoingMessageWithAttachment({
        messageResponses: {
          messages: messageResponses,
        },
        agent: agent,
        filename: process.env.BASE_URL + '/message/image/' + file.filename,
        type: MessageType.image,
      });

    //kirim ke frontend lewat websocket
    for (const message of messageEntities) {
      const response = this.messageService.mapMessageEntityToResponse(message);
      await this.gateway.sendMessage({ data: response });
    }
    //return result
    const result: ApiResponse<MessageEntity[]> = {
      success: true,
      data: messageEntities,
      message: 'Success sending message to Wablas API',
    };
    return result;
  }

  validateArray(array: string): string[] {
    try {
      const categories: string[] = JSON.parse(array);
      if (!isArray(array)) {
        throw new BadRequestException('Provide array please');
      }
      return categories;
    } catch (error) {
      throw new BadRequestException('JSON Parse error on value ' + array);
    }
  }

  //kirim gambar ke customer
  async broadcastDocumentToCustomer(
    file: Express.Multer.File,
    body: BroadcastDocumentMessageRequestDto,
    agent: UserEntity,
  ) {
    const categories = this.validateArray(body.categories);
    const interests = this.validateArray(body.interests);
    const types = this.validateArray(body.types);

    const customers = await this.getCustomers(
      categories,
      interests,
      types,
      agent.email,
    );

    const requestData: WablasSendDocumentRequestData[] = customers.map(
      (customer) => ({
        phone: customer.phoneNumber,
        document: process.env.BASE_URL + '/message/document/' + file.filename,
        isGroup: false,
        retry: false,
        secret: false,
      }),
    );

    //templating request
    const request: WablasSendDocumentRequest = {
      data: requestData,
    };

    return await this.sendMockDocumentResponseWithAttachment(
      request,
      agent,
      file,
    );

    // //buat request ke WABLAS API
    // return this.http
    //   .post('/api/v2/send-document', JSON.stringify(request), {
    //     headers: {
    //       Authorization: `${process.env.WABLAS_TOKEN}`,
    //       'Content-Type': 'application/json',
    //       Accept: 'application/json',
    //     },
    //   })
    //   .pipe(
    //     map(
    //       async (
    //         response: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
    //       ) => {
    //         //save ke database
    //         const messages =
    //           await this.messageService.saveOutgoingMessageWithAttachment({
    //             messageResponses: response.data.data,
    //             agent: agent,
    //             filename: file.filename,
    //             type: MessageType.document,
    //           });

    //         //kirim ke frontend lewat websocket
    //         const messageResponse = await Promise.all(
    //           messages.map(async (message: MessageEntity) => {
    //             const response =
    //               this.messageService.mapMessageEntityToResponse(message);
    //             await this.gateway.sendMessage({ data: response });
    //             return response;
    //           }),
    //         );

    //         //return result
    //         const result: ApiResponse<MessageEntity[]> = {
    //           success: true,
    //           data: messageResponse,
    //           message: 'Success sending message to Wablas API',
    //         };
    //         return result;
    //       },
    //     ),
    //     catchError((value: AxiosError<WablasApiResponse<any>>) => {
    //       if (value.response !== undefined) {
    //         throw new WablasAPIException(
    //           'Failed to send message to Wablas API. Message : ' +
    //             value.response.data.message,
    //         );
    //       }
    //       throw new WablasAPIException('Failed to send message to Wablas API.');
    //     }),
    //   );
  }

  async sendMockDocumentResponseWithAttachment(
    request: WablasSendDocumentRequest,
    agent: UserEntity,
    file: Express.Multer.File,
  ) {
    const messageResponses = request.data.map<ImageResponseItem>((item) => ({
      id: '123',
      phone: item.phone,
      status: MessageStatus.PENDING,
      image: '',
    }));

    const messageEntities =
      await this.messageService.saveOutgoingMessageWithAttachment({
        messageResponses: {
          messages: messageResponses,
        },
        agent: agent,
        filename: process.env.BASE_URL + '/message/document/' + file.filename,
        type: MessageType.image,
      });

    //kirim ke frontend lewat websocket
    for (const message of messageEntities) {
      const response = this.messageService.mapMessageEntityToResponse(message);
      await this.gateway.sendMessage({ data: response });
    }
    //return result
    const result: ApiResponse<MessageEntity[]> = {
      success: true,
      data: messageEntities,
      message: 'Success sending message to Wablas API',
    };
    return result;
  }
}
