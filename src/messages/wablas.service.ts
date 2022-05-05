import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  SendDocumentResponse,
  SendImageVideoResponse,
  SendMessageResponseData,
  WablasApiResponse,
  WablasSendDocumentRequest,
  WablasSendImageRequest,
  WablasSendMessageRequest,
  WablasSendVideoRequest,
} from './message.dto';

@Injectable()
export class WablasService {
  constructor(private http: HttpService) {}

  sendMessage(request: WablasSendMessageRequest) {
    return this.http.post<WablasApiResponse<SendMessageResponseData>>(
      '/api/v2/send-message',
      JSON.stringify(request),
      {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  }

  sendImage(request: WablasSendImageRequest) {
    return this.http.post<WablasApiResponse<SendImageVideoResponse>>(
      '/api/v2/send-image',
      JSON.stringify(request),
      {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  }

  sendDocument(request: WablasSendDocumentRequest) {
    return this.http.post<WablasApiResponse<SendDocumentResponse>>(
      '/api/v2/send-document',
      JSON.stringify(request),
      {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  }

  sendVideo(request: WablasSendVideoRequest) {
    return this.http.post<WablasApiResponse<SendImageVideoResponse>>(
      '/api/v2/send-video',
      JSON.stringify(request),
      {
        headers: {
          Authorization: `${process.env.WABLAS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  }
}
