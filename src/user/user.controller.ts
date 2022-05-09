import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Role } from 'src/core/repository/user/user.entity';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ChangePasswordDto } from './user.dto';
import { UserService } from './user.service';
import { RegisterRequestDto } from 'src/auth/auth.dto';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getAllUsers(@Query('search') search?: string) {
    return this.userService.getAllUsers(search);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  addUser(@Body() request: RegisterRequestDto) {
    return this.userService.addUser(request);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() body: ChangePasswordDto, @Request() request) {
    return this.userService.changePassword(body, request.user);
  }

  @Get('profile_image/:file_name')
  getProfilePhoto(@Param('file_name') filename: string, @Res() res) {
    res.sendFile(filename, { root: 'uploads/profile_pictures' });
  }
}
