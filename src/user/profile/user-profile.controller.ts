import {
  Body,
  Controller,
  Get,
  UseGuards,
  Request,
  Put,
  ClassSerializerInterceptor,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { UserEntity } from '../../core/repository/user/user.entity';
import { EditProfileRequestDto } from '../user.dto';
import { UserProfileService } from './user-profile.service';

@Controller('user/profile')
@UseInterceptors(ClassSerializerInterceptor)
export class UserProfileController {
  constructor(private service: UserProfileService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  getCurrentUser(@Request() request) {
    return this.service.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateProfile(@Request() request, @Body() body: EditProfileRequestDto) {
    const user: UserEntity = request.user;
    return this.service.editProfile(user, body);
  }

  @Put('profile_image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: 'uploads/profile_pictures',
        filename: (request, file, cb) => {
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
  @UseGuards(JwtAuthGuard)
  updateProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() request,
  ) {
    const user: UserEntity = request.user;
    return this.service.updateProfilePhoto(file, user);
  }
}
