import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { CustomerStatus } from 'src/core/pukapuka/customer-crm.dto';
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

export class BulkMessageRequestDto {
  @ValidateNested({
    each: true,
  })
  messages: MessageRequestDto[];
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

  @IsNotEmpty()
  categories: string;

  @IsNotEmpty()
  interests: string;

  @IsEnum(CustomerStatus)
  status: CustomerStatus;

  @IsNotEmpty()
  types: string;
}

export class BroadcastDocumentMessageRequestDto {
  @IsNotEmpty()
  categories: string;

  @IsNotEmpty()
  interests: string;

  @IsNotEmpty()
  types: string;

  @IsEnum(CustomerStatus)
  status: CustomerStatus;
}

export class DocumentRequestDto {
  @IsNotEmpty()
  customerNumber: string;
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

  @IsEnum(CustomerStatus)
  status: CustomerStatus;
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

export type MessageTrackingDto = {
  id: string;
  message: string;
  phone: string;
  deviceId: string;
  sender: string;
  status: MessageStatus;
  note: string;
  timestamp: Date;
};

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
