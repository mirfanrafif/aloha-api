import { Injectable } from '@nestjs/common';
import { MessageEntity } from '../../core/repository/message/message.entity';
import { MessageResponseDto } from '../message.dto';

@Injectable()
export class MessageHelper {
  mapMessageEntityToResponse(data: MessageEntity) {
    let sender_name: string;
    if (!data.fromMe) {
      sender_name = data.customer.name;
    } else if (data.agent === undefined || data.agent === null) {
      sender_name = 'Sistem';
    } else {
      sender_name = data.agent.full_name;
    }

    //send to frontend via websocket
    const response: MessageResponseDto = {
      id: data.id,
      customer: data.customer,
      fromMe: data.fromMe,
      file: data.file,
      message: data.message,
      agent: data.agent,
      sender_name: sender_name,
      messageId: data.messageId,
      status: data.status,
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
    return response;
  }
}
