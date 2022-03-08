import { ApiProperty } from '@nestjs/swagger';

export class TextMessage {
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
}

export class ImageMessage extends TextMessage {
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
}

export class DocumentMessage extends TextMessage {
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
}

export class MessageRequestData {
  @ApiProperty()
  phone: string;

  @ApiProperty()
  message: string;
  secret: boolean;
  priority: boolean;
}

export class MessageRequest {
  @ApiProperty()
  data: MessageRequestData[];
}

export class ApiResponse<T> {
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
