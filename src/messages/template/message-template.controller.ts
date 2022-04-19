import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateRequestDto } from '../message.dto';
import { MessageService } from '../message.service';

@Controller('message-template')
export class MessageTemplateController {
  constructor(private service: MessageTemplateService) {}

  @Get()
  getMessageTemplate() {
    return this.service.getMessageTemplates();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  addMessageTemplate(@Body() body: MessageTemplateRequestDto) {
    return this.service.addMessageTemplate(body);
  }
}
