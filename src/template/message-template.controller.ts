import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateRequestDto } from './message-template.dto';

@Controller('message-template')
@UseInterceptors(ClassSerializerInterceptor)
export class MessageTemplateController {
  constructor(private service: MessageTemplateService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getMessageTemplate(@Request() request) {
    return this.service.getMessageTemplates(request.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  addMessageTemplate(
    @Body() body: MessageTemplateRequestDto,
    @Request() request,
  ) {
    return this.service.addMessageTemplate(body, request.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateMessageTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MessageTemplateRequestDto,
  ) {
    return this.service.updateMessageTemplate(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteMessageTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteTemplate(id);
  }
}
