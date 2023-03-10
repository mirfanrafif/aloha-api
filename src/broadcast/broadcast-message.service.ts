import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import { isArray } from 'class-validator';
import { map, catchError, lastValueFrom } from 'rxjs';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { MessageEntity } from 'src/core/repository/message/message.entity';
import { MESSAGE_REPOSITORY } from 'src/core/repository/message/message.module';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { CustomerCrmService } from 'src/core/pukapuka/customer-crm.service';
import {
  CustomerCrmSearchFilter,
  CustomerStatus,
} from 'src/core/pukapuka/customer-crm.dto';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { WablasAPIException } from 'src/utils/wablas.exception';
import { Repository } from 'typeorm';
import { MessageHelper } from '../messages/helper/message.helper';
import {
  BroadcastMessageRequest,
  BroadcastImageMessageRequestDto,
  BroadcastDocumentMessageRequestDto,
  MessageType,
} from 'src/messages/message.dto';

import {
  SendDocumentResponse,
  SendImageVideoResponse,
  SendMessageResponseData,
  WablasApiResponse,
  WablasSendDocumentRequest,
  WablasSendDocumentRequestData,
  WablasSendImageRequest,
  WablasSendImageRequestData,
  WablasSendMessageRequest,
  WablasSendMessageRequestData,
  WablasSendVideoRequest,
  WablasSendVideoRequestData,
} from 'src/core/wablas/wablas.dto';
import { MessageGateway } from 'src/messages/gateways/message.gateway';
import { WablasService } from 'src/core/wablas/wablas.service';

@Injectable()
export class BroadcastMessageService {
  constructor(
    private customerService: CustomerService,
    private customerCrmService: CustomerCrmService,
    private gateway: MessageGateway,
    @Inject(MESSAGE_REPOSITORY)
    private messageRepository: Repository<MessageEntity>,
    private wablasService: WablasService,
    private messageHelper: MessageHelper,
  ) {}

  //mencari list customer dari crm
  async getCustomers(
    categories: string[],
    interests: string[],
    types: string[],
    status: CustomerStatus,
  ) {
    const filter: CustomerCrmSearchFilter = {
      'filter.categories.name':
        categories.length > 0 ? '$in:' + categories.join(',') : undefined,
      'filter.interests.name':
        interests.length > 0 ? '$in:' + interests.join(',') : undefined,
      'filter.types.name':
        types.length > 0 ? '$in:' + types.join(',') : undefined,
      'filter.status': status,
      // 'filter.users.email': '$eq:' + email,
    };

    console.log('Broadcast params: ', filter);

    const customer: CustomerEntity[] = await lastValueFrom(
      this.customerCrmService.getCustomerWithFilters(filter),
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
      body.status,
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

    // return await this.mockSendBroadcastMessasge(request, agent);

    //buat request ke WABLAS API
    return <ApiResponse<any[]>>{
      success: true,
      data: [],
      message: '',
    };
    return this.wablasService.sendMessage(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendMessageResponseData>>,
        ) => {
          //save ke database
          const messages = await this.saveOutgoingBroadcastMessage({
            messageResponses: response.data.data,
            agent: agent,
          });
          //kirim ke frontend lewat websocket
          for (const message of messages) {
            const response =
              this.messageHelper.mapMessageEntityToResponse(message);
            await this.gateway.sendMessage({ data: response });
          }
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
  private async saveOutgoingBroadcastMessage({
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
          : await this.customerService.findCustomer({
              phoneNumber: messageItem.phone,
            });
      let message = this.messageRepository.create({
        messageId: messageItem.id ?? '',
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

  //kirim gambar ke customer
  async broadcastImageToCustomer(
    file: Express.Multer.File,
    body: BroadcastImageMessageRequestDto,
    agent: UserEntity,
  ) {
    const categories = JSON.parse(body.categories);
    const interests = JSON.parse(body.interests);
    const types = JSON.parse(body.types);
    const status = JSON.parse(body.status);

    const customers = await this.getCustomers(
      categories,
      interests,
      types,
      status,
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

    // return await this.sendMockImageWithAttachment(request, agent, file);

    //buat request ke WABLAS API
    return <ApiResponse<any[]>>{
      success: true,
      data: [],
      message: '',
    };
    return this.wablasService.sendImage(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendImageVideoResponse>>,
        ) => {
          //save ke database
          const messages = await this.saveImageVideoMessage({
            messageResponses: response.data.data,
            agent: agent,
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
  async broadcastVideoToCustomer(
    file: Express.Multer.File,
    body: BroadcastImageMessageRequestDto,
    agent: UserEntity,
  ) {
    // const categories = this.validateArray(body.categories);
    // const interests = this.validateArray(body.interests);
    // const types = this.validateArray(body.types);

    const categories = JSON.parse(body.categories);
    const interests = JSON.parse(body.interests);
    const types = JSON.parse(body.types);
    const status = JSON.parse(body.status);

    const customers = await this.getCustomers(
      categories,
      interests,
      types,
      status,
    );

    const sendImageData: WablasSendVideoRequestData[] = customers.map(
      (item) => ({
        phone: item.phoneNumber,
        video: process.env.BASE_URL + '/message/video/' + file.filename,
        caption: body.message,
        isGroup: false,
        retry: false,
        secret: false,
      }),
    );
    //templating request
    const request: WablasSendVideoRequest = {
      data: sendImageData,
    };

    // return await this.sendMockVideoResponseWithAttachment(request, agent, file);

    // buat request ke WABLAS API
    return <ApiResponse<any[]>>{
      success: true,
      data: [],
      message: '',
    };
    return this.wablasService.sendVideo(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendImageVideoResponse>>,
        ) => {
          //save ke database
          const messages = await this.saveImageVideoMessage({
            messageResponses: response.data.data,
            agent: agent,
            filename: process.env.BASE_URL + '/message/image/' + file.filename,
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

  //simpan pesan dokumen keluar
  private async saveImageVideoMessage({
    messageResponses,
    customer,
    agent,
    filename,
    type,
  }: {
    messageResponses: SendImageVideoResponse;
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
          : await this.customerService.findCustomer({
              phoneNumber: messageItem.phone,
            });
      const message = await this.messageRepository.save({
        messageId: messageItem.id ?? '',
        message: messageItem.caption ?? '',
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

  //validasi array string kategori, minat dan tipe pelanggan
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
    const categories = JSON.parse(body.categories);
    const interests = JSON.parse(body.interests);
    const types = JSON.parse(body.types);
    const status = JSON.parse(body.status);

    const customers = await this.getCustomers(
      categories,
      interests,
      types,
      status,
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

    // return await this.sendMockDocumentResponseWithAttachment(
    //   request,
    //   agent,
    //   file,
    // );

    //buat request ke WABLAS API
    return this.wablasService.sendDocument(request).pipe(
      map(
        async (
          response: AxiosResponse<WablasApiResponse<SendDocumentResponse>>,
        ) => {
          //save ke database
          const messages = await this.saveDocumentMessage({
            messageResponses: response.data.data,
            agent: agent,
            filename: file.filename,
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

  //simpan pesan dokumen keluar
  private async saveDocumentMessage({
    messageResponses,
    customer,
    agent,
    filename,
    type,
  }: {
    messageResponses: SendDocumentResponse;
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
          : await this.customerService.findCustomer({
              phoneNumber: messageItem.phone,
            });
      const message = await this.messageRepository.save({
        messageId: messageItem.id ?? '',
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
}
