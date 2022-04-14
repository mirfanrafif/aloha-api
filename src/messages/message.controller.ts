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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import {
  BroadcastMessageRequest,
  DocumentRequestDto,
  ImageMessageRequestDto,
  MessageRequestDto,
  MessageResponseDto,
  MessageTrackingDto,
  StartConversationDto,
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
  trackMessageStatus(@Body() body: MessageTrackingDto) {
    return this.service.updateMessageStatus(body);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  handleAgentMessage(@Request() request, @Body() data: MessageRequestDto) {
    const user: UserEntity = request.user;
    return this.service.sendMessageToCustomer({
      messageRequest: data,
      agent: user,
    });
  }

  @Get(':customer_id')
  @UseGuards(JwtAuthGuard)
  async getPastMessages(
    @Param('customer_id', ParseIntPipe) customerId: number,
    @Query('last_message_id') lastMessageId?: number,
  ): Promise<ApiResponse<MessageResponseDto[]>> {
    return this.service.getPastMessageByCustomerId(
      customerId,
      lastMessageId !== undefined ? lastMessageId : 0,
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
    return await this.service.getMessageByAgentId(request.user, lastCustomerId);
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
          //file name biar keliatan random aja sih
          const timestamp = Date.now().toString();
          const filename =
            file.originalname.split('.')[0].slice(0, 16) +
            '-' +
            timestamp +
            extname(file.originalname);
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  sendImageToCustomer(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: ImageMessageRequestDto,
    @Request() request,
  ) {
    const user: UserEntity = request.user;
    return this.service.sendImageToCustomer(image, body, user);
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('document', {
      storage: diskStorage({
        destination: 'uploads/messages/document',
        filename: (request, file, cb) => {
          //file name biar keliatan random aja sih
          //file name biar keliatan random aja sih
          const timestamp = Date.now().toString();
          const filename =
            file.originalname.split('.')[0].slice(0, 16) +
            '-' +
            timestamp +
            extname(file.originalname);
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  sendDocumentToCustomer(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: DocumentRequestDto,
    @Request() request,
  ) {
    return this.service.sendDocumentToCustomer(file, data, request.user);
  }

  @Get('image/:file_name')
  getMessageImage(@Param('file_name') fileName: string, @Res() res) {
    res.sendFile(fileName, { root: 'uploads/messages/image' });
  }

  @Get('document/:document_name')
  getMessageDocument(@Param('document_name') filename: string, @Res() res) {
    res.sendFile(filename, { root: 'uploads/messages/document' });
  }
}
