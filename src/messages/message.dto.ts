import { ApiProperty } from '@nestjs/swagger';

export type TextMessage = {
  id: string;
  phone: string;
  message: string;
  pushName: string;
  thumbProfile: string;
  groupId: string;
  groupSubject: string;
  timestamp: number;
  category: string;
  receiver: number;
};

export type ImageMessage = {
  id: string;
  phone: string;
  message: string;
  pushName: string;
  thumbProfile: string;
  groupId: string;
  groupSubject: string;
  timestamp: number;
  category: string;
  receiver: number;
  image: string;
  url: string;
};

export type DocumentMessage = {
  id: string;
  phone: string;
  message: string;
  pushName: string;
  thumbProfile: string;
  groupId: string;
  groupSubject: string;
  timestamp: number;
  category: string;
  receiver: number;
  image: string;
  url: string;
};

export class MessageRequestData {
  @ApiProperty()
  phone: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  secret: boolean;

  @ApiProperty({ required: false })
  priority: boolean;
}

export class MessageRequest {
  @ApiProperty()
  data: MessageRequestData[];
}

export class WablasApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export class SendMessageResponseData {
  quota: number;
  message: Message[];
}

export class Message {
  id: string;
  phone: string;
  message: string;
  status: MessageStatus;
}

export type MessageResponse = {
  messageId: string;
  senderId: string;
  message: string;
  consumerNumber: string;
  status: MessageStatus;
};

enum MessageStatus {
  sent = 'sent',
  read = 'read',
  cancel = 'cancel',
  received = 'received',
  reject = 'reject',
  pending = 'pending',
}
