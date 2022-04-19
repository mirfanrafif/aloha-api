import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateRequestDto } from '../message.dto';

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

  @Put(':id')
  updateMessageTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MessageTemplateRequestDto,
  ) {
    return this.service.updateMessageTemplate(id, body);
  }

  @Delete(':id')
  deleteMessageTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteTemplate(id);
  }
}
