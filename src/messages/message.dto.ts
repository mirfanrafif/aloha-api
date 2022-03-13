import { IsNotEmpty } from 'class-validator';

export type TextMessage = {
  id: string;
  pushName: string;
  isGroup: boolean;
  group: Group;
  message: string;
  phone: string;
  messageType: MessageType;
  file: string;
  mimeType: string;
  // thumbProfile: string;
  sender: number;
  timestamp: number;
};

export enum MessageType {
  text = 'text',
  document = 'document',
  image = 'image',
}

export type Group = {
  subject: string;
  owner: string;
  desc: string;
};
export class MessageRequestDto {
  @IsNotEmpty()
  customerNumber: string;

  @IsNotEmpty()
  message: string;
}

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
  message: string;
  status: MessageStatus;
}

enum MessageStatus {
  sent = 'sent',
  read = 'read',
  cancel = 'cancel',
  received = 'received',
  reject = 'reject',
  pending = 'pending',
}

export class BroadcastMessageRequest {
  messages: MessageRequestDto[];
}
