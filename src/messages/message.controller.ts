import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { MessageEntity } from 'src/core/repository/message/message.entity';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { DbexceptionFilter } from 'src/utils/dbexception.filter';
import {
  BroadcastMessageRequest,
  MessageRequestDto,
  MessageResponseDto,
  TextMessage,
} from './message.dto';
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

  @Post('tracking')
  trackMessageStatus(@Body() body) {
    console.log(body);
    return body;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseFilters(DbexceptionFilter)
  handleAgentMessage(@Request() request, @Body() data: MessageRequestDto) {
    const user: UserEntity = request.user;
    return this.service.sendMessageToCustomer(data, user);
  }

  @Get(':customer_number')
  @UseGuards(JwtAuthGuard)
  async getPastMessages(
    @Request() request,
    @Param('customer_number', ParseIntPipe) customerId: number,
    @Query('last_message_id') lastMessageId?: number,
  ): Promise<ApiResponse<MessageResponseDto[]>> {
    const user: UserEntity = request.user;
    return this.service.getPastMessageByCustomerId(
      customerId,
      lastMessageId !== undefined ? lastMessageId : 0,
      user,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCustomerByAgentId(
    @Request() request,
    @Query('search') customerNumber?: string,
    @Query('last_customer_id') lastCustomerId?: number,
  ): Promise<ApiResponse<any>> {
    if (customerNumber !== undefined) {
      return this.service.searchCustomer(customerNumber, request.user);
    }
    return await this.service.getCustomerByAgentId(
      request.user,
      lastCustomerId,
    );
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  broadcastMessageToCustomer(
    @Body() body: BroadcastMessageRequest,
    @Request() request,
  ) {
    return this.service.broadcastMessageToCustomer(
      body,
      request.user as UserEntity,
    );
  }
}
