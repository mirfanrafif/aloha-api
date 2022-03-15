import { IsEnum, IsNotEmpty } from 'class-validator';
import { MessageStatus } from 'src/core/repository/message/message.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';

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
export class TextMessage {
  id: string;
  pushName: string;
  isGroup: boolean;
  group: Group;
  message: string;
  phone: string;

  @IsNotEmpty()
  @IsEnum(MessageType)
  messageType: MessageType;

  file: string;
  mimeType: string;
  // thumbProfile: string;
  sender: number;
  timestamp: number;
}
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

export class BroadcastMessageRequest {
  messages: MessageRequestDto[];
}

export class MessageResponseDto {
  id: number;
  messageId: string;
  message: string;
  customerNumber: string;
  status: MessageStatus;
  agent: UserEntity;
  file: string;
  sender_name: string;
  type: MessageType;
  fromMe: boolean;
  created_at: Date;
  updated_at: Date;
}
