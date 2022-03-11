import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { MessageEntity } from 'src/core/repository/message/message.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { DbexceptionFilter } from 'src/utils/dbexception.filter';
import { MessageRequestDto, TextMessage } from './message.dto';
import { MessageService } from './message.service';

@Controller('message')
@UseFilters(DbexceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class MessageController {
  constructor(private service: MessageService) {}

  @Post('webhook')
  handleIncomingMessage(@Body() message: TextMessage) {
    return this.service.handleIncomingMessage(message);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseFilters(DbexceptionFilter)
  handleAgentMessage(@Request() request, @Body() data: MessageRequestDto) {
    const user: UserEntity = request.user;
    return this.service.sendMessageToCustomer(data, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPastMessages(
    @Request() request,
    @Query('customer_number') customerNumber?: string,
    @Query('last_message_id') lastMessageId?: number,
  ): Promise<ApiResponse<MessageEntity[]>> {
    const user: UserEntity = request.user;
    if (customerNumber !== undefined) {
      return this.service.getPastMessageByCustomerNumber(
        customerNumber !== undefined ? customerNumber : '0',
        lastMessageId !== undefined ? lastMessageId : 0,
        user,
      );
    }
    return {
      success: false,
      data: [],
      message: 'Please provide customer_number',
    };
  }

  @Post('tracking')
  trackMessageStatus(@Body() body) {
    console.log(body);
  }
}
