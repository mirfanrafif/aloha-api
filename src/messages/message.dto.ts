import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { MessageStatus } from 'src/core/repository/message/message.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';

export enum MessageType {
  text = 'text',
  document = 'document',
  image = 'image',
  video = 'video',
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

export class ImageMessageRequestDto {
  @IsNotEmpty()
  customerNumber: string;

  @IsString()
  message: string;
}

export class BroadcastImageMessageRequestDto {
  @IsString()
  message: string;

  @IsArray()
  categories: string[];

  @IsArray()
  interests: string[];

  @IsArray()
  types: string[];
}

export class BroadcastDocumentMessageRequestDto {
  @IsArray()
  categories: string[];

  @IsArray()
  interests: string[];

  @IsArray()
  types: string[];
}

export class DocumentRequestDto {
  @IsNotEmpty()
  customerNumber: string;
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

export class SendImageResponseData {
  messages: ImageResponseItem[];
}

export class ImageResponseItem {
  id: string;
  phone: string;
  message?: string;
  caption: string;
  image: string;
  status: MessageStatus;
}

export class SendVideoResponseData {
  messages: ImageResponseItem[];
}

export class VideoResponseItem {
  id: string;
  phone: string;
  message?: string;
  caption: string;
  video: string;
  status: MessageStatus;
}

export class BroadcastMessageRequest {
  @IsNotEmpty()
  message: string;

  @IsArray()
  categories: string[];

  @IsArray()
  interests: string[];

  @IsArray()
  types: string[];
}

export class MessageResponseDto {
  id: number;
  messageId: string;
  message: string;
  customer: CustomerEntity;
  status: MessageStatus;
  agent: UserEntity;
  file: string;
  sender_name: string;
  type: MessageType;
  fromMe: boolean;
  created_at: Date;
  updated_at: Date;
}

export class MessageTrackingDto {
  @IsNotEmpty()
  id: string;

  @IsString()
  message: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  deviceId: string;

  @IsNotEmpty()
  sender: string;

  @IsEnum(MessageStatus)
  status: MessageStatus;

  @IsString()
  note: string;

  @IsNotEmpty()
  timestamp: Date;
}

export class MessageTemplateRequestDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  template: string;
}

export class StartConversationDto {
  @IsNotEmpty()
  @IsNumber()
  customerId: number;
}

export class SendDocumentViaUrlDto {
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsNotEmpty()
  customerNumber: string;
}
