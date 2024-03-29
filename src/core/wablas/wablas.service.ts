import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { createWriteStream } from 'fs';
import { map, Observable } from 'rxjs';
import { WablasAPIException } from 'src/utils/wablas.exception';
import { MessageType, TextMessage } from '../../messages/message.dto';
import {
  SendDocumentResponse,
  SendImageVideoResponse,
  SendMessageResponseData,
  WablasApiResponse,
  WablasSendDocumentRequest,
  WablasSendImageRequest,
  WablasSendMessageRequest,
  WablasSendVideoRequest,
} from './wablas.dto';

@Injectable()
export class WablasService {
  constructor(private http: HttpService) {}

  sendMessage(
    request: WablasSendMessageRequest,
  ): Observable<
    AxiosResponse<WablasApiResponse<SendMessageResponseData>, any>
  > {
    return this.http
      .post<WablasApiResponse<SendMessageResponseData>>(
        '/api/v2/send-message',
        JSON.stringify(request),
        {
          headers: {
            Authorization: `${process.env.WABLAS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      .pipe(
        map((response) => {
          console.log(`
          Wablas Request: ${JSON.stringify(request)}
          Wablas Response: ${JSON.stringify(response.data)}
          `);
          if (!response.data.status) {
            console.log('Wablas Error', response.data.message);
            throw new WablasAPIException(response.data.message);
          }
          return response;
        }),
      );
  }

  sendImage(
    request: WablasSendImageRequest,
  ): Observable<AxiosResponse<WablasApiResponse<SendImageVideoResponse>, any>> {
    return this.http
      .post<WablasApiResponse<SendImageVideoResponse>>(
        '/api/v2/send-image',
        JSON.stringify(request),
        {
          headers: {
            Authorization: `${process.env.WABLAS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      .pipe(
        map((response) => {
          console.log(`
          Wablas Request: ${JSON.stringify(request)}
          Wablas Response: ${JSON.stringify(response.data)}
          `);
          if (!response.data.status) {
            console.log('Wablas Error', response.data.message);
            throw new WablasAPIException(response.data.message);
          }
          return response;
        }),
      );
  }

  sendDocument(
    request: WablasSendDocumentRequest,
  ): Observable<AxiosResponse<WablasApiResponse<SendDocumentResponse>, any>> {
    return this.http
      .post<WablasApiResponse<SendDocumentResponse>>(
        '/api/v2/send-document',
        JSON.stringify(request),
        {
          headers: {
            Authorization: `${process.env.WABLAS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      .pipe(
        map((response) => {
          console.log(`
          Wablas Request: ${JSON.stringify(request)}
          Wablas Response: ${JSON.stringify(response.data)}
          `);
          if (!response.data.status) {
            console.log('Wablas Error', response.data.message);
            throw new WablasAPIException(response.data.message);
          }
          return response;
        }),
      );
  }

  sendVideo(
    request: WablasSendVideoRequest,
  ): Observable<AxiosResponse<WablasApiResponse<SendImageVideoResponse>, any>> {
    return this.http
      .post<WablasApiResponse<SendImageVideoResponse>>(
        '/api/v2/send-video',
        JSON.stringify(request),
        {
          headers: {
            Authorization: `${process.env.WABLAS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      .pipe(
        map((response) => {
          console.log(`
          Wablas Request: ${JSON.stringify(request)}
          Wablas Response: ${JSON.stringify(response.data)}
          `);
          if (!response.data.status) {
            console.log('Wablas Error', response.data.message);
            throw new WablasAPIException(response.data.message);
          }
          return response;
        }),
      );
  }

  async getFile(message: TextMessage, filename: string): Promise<string> {
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

    //save message attachment to storage
    const file = await this.http.axiosRef({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
    });

    file.data.pipe(
      createWriteStream(
        `./uploads/messages/${message.messageType}/incoming-${filename}`,
      ),
    );

    //set file url
    switch (message.messageType) {
      case MessageType.image:
        return process.env.BASE_URL + '/message/image/incoming-' + filename;
      case MessageType.video:
        return process.env.BASE_URL + '/message/video/incoming-' + filename;
      case MessageType.document:
        return process.env.BASE_URL + '/message/document/incoming-' + filename;
      default:
        return '';
    }
  }
}
