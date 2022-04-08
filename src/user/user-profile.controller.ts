import {
  Body,
  Controller,
  Get,
  UseGuards,
  Request,
  Put,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { EditProfileRequestDto } from './user.dto';
import { UserService } from './user.service';

@Controller('user/profile')
@UseInterceptors(ClassSerializerInterceptor)
export class UserProfileController {
  constructor(private userService: UserService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  getCurrentUser(@Request() request) {
    return this.userService.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateProfile(@Request() request, @Body() body: EditProfileRequestDto) {
    const user: UserEntity = request.user;
    return this.userService.editProfile(user, body);
  }
}
