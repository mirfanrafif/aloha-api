import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { BroadcastMessageService } from './broadcast-message.service';
import {
  BroadcastMessageRequest,
  BroadcastImageMessageRequestDto,
  BroadcastDocumentMessageRequestDto,
} from '../messages/message.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('message/broadcast')
export class MessageBroadcastController {
  constructor(private service: BroadcastMessageService) {}

  @Post()
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
  broadcastImageToCustomer(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: BroadcastImageMessageRequestDto,
    @Request() request,
  ) {
    const user: UserEntity = request.user;
    return this.service.broadcastImageToCustomer(image, body, user);
  }

  @Post('video')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: 'uploads/messages/video',
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
  broadcastVideoToCustomer(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: BroadcastImageMessageRequestDto,
    @Request() request,
  ) {
    const user: UserEntity = request.user;
    return this.service.broadcastVideoToCustomer(image, body, user);
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
  broadcastDocumentToCustomer(
    @UploadedFile() file: Express.Multer.File,
    @Request() request,
    @Body() body: BroadcastDocumentMessageRequestDto,
  ) {
    return this.service.broadcastDocumentToCustomer(file, body, request.user);
  }
}
