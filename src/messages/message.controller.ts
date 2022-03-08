import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { MessageEntity } from 'src/core/repository/chat/message.entity';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { DbexceptionFilter } from 'src/utils/dbexception.filter';
import {
  DocumentMessage,
  ImageMessage,
  MessageRequest,
  TextMessage,
} from './message.dto';
import { ChatService } from './message.service';

@Controller('chat')
@UseFilters(DbexceptionFilter)
export class MessageController {
  constructor(private service: ChatService) {}

  @Post('webhook')
  handleIncomingMessage(
    @Body() message: DocumentMessage | ImageMessage | TextMessage,
  ) {
    return this.service.handleIncomingMessage(message);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseFilters(DbexceptionFilter)
  handleSalesMessage(@Request() request, @Body() data: MessageRequest) {
    return this.service.sendMessageToCustomer(data, request.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPastMessages(
    @Request() request,
    @Query('customer_number') customerNumber?: string,
    @Query('page') page?: number,
  ): Promise<ApiResponse<MessageEntity[]>> {
    if (customerNumber !== undefined) {
      return this.service.getPastMessageByCustomerNumber(
        customerNumber !== undefined ? customerNumber : '0',
        page !== undefined ? page : 0,
        request.user.id,
      );
    } else {
      return {
        success: false,
        data: [],
        message: 'Please provide customer_number',
      };
    }
  }
}
