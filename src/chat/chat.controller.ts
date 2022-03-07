import { Body, Controller, Post } from '@nestjs/common';
import { DocumentMessage, ImageMessage, TextMessage } from './chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  @Post('webhook')
  handleIncomingMessage(
    @Body() message: DocumentMessage | ImageMessage | TextMessage,
  ) {
    this.service.handleIncomingMessage(message);
  }
}
