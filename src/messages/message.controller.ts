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
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: 'uploads/messages/image',
        filename: (request, file, cb) => {
          //file name biar keliatan random aja sih
          const filename = Buffer.from(
            Date.now().toString() + file.originalname.slice(0, 16),
            'utf-8',
          ).toString('base64url');
          cb(null, filename + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  sendImageToCustomer(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: MessageRequestDto,
    @Request() request,
  ) {
    const user: UserEntity = request.user;
    return this.service.sendImageToCustomer(image, body, user);
  }

  @Get('image/:file_name')
  getMessageImage(@Param('file_name') fileName: string, @Res() res) {
    res.sendFile(fileName, { root: 'uploads/messages/image' });
  }
}
