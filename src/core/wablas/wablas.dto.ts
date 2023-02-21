import { MessageStatus } from '../repository/message/message.entity';

export type WablasSendMessageRequest = {
  data: WablasSendMessageRequestData[];
};

export type WablasSendMessageRequestData = {
  phone: string;
  message: string;
  secret: boolean;
  retry: boolean;
  isGroup: boolean;
};

export type WablasSendDocumentRequest = {
  data: WablasSendDocumentRequestData[];
};

export type WablasSendDocumentRequestData = {
  phone: string;
  document: string;
  secret: boolean;
  retry: boolean;
  isGroup: boolean;
};

export type WablasSendImageRequest = {
  data: WablasSendImageRequestData[];
};

export type WablasSendImageRequestData = {
  phone: string;
  image: string;
  caption?: string;
  secret: boolean;
  retry: boolean;
  isGroup: boolean;
};

export type WablasSendVideoRequest = {
  data: WablasSendVideoRequestData[];
};

export type WablasSendVideoRequestData = {
  phone: string;
  video: string;
  caption: string;
  secret: boolean;
  retry: boolean;
  isGroup: boolean;
};

export class WablasApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export class SendMessageResponseData {
  messages: MessageResponseItem[];
}

export class MessageResponseItem {
  id: string;
  phone: string;
  message?: string;
  status: MessageStatus;
}

export class SendImageVideoResponse {
  messages: SendImageVideoResponseItem[];
}

export class SendImageVideoResponseItem {
  id: string;
  phone: string;
  caption?: string;
  image: string;
  status: MessageStatus;
}

export class SendVideoResponseData {
  messages: SendImageVideoResponseItem[];
}

export class VideoResponseItem {
  id: string;
  phone: string;
  message?: string;
  caption: string;
  video: string;
  status: MessageStatus;
}

export type SendDocumentResponse = {
  quota: number;
  messages: Message[];
};

export type Message = {
  id: string;
  phone: string;
  message: null;
  status: MessageStatus;
};
