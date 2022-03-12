import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterRequestDto } from 'src/auth/auth.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { AddJobRequest } from './user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getCurrentUser(@Request() request) {
    return this.userService.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() request) {
    const user: UserEntity = request.user;
    const updateRequest: RegisterRequestDto = request.body;
    return this.userService.updateProfile(user, updateRequest);
  }

  @Get('job')
  getJobList() {
    return this.userService.getJobList();
  }

  @Get('job/:id')
  @UseGuards(JwtAuthGuard)
  getJobAgents(@Param('id', ParseIntPipe) id: number, @Request() request) {
    const user: UserEntity = request.user;
    return this.userService.getJobAgents(id, user);
  }

  @Post('job')
  addJob(@Body() body: AddJobRequest) {
    return this.userService.addJob(body);
  }
}
