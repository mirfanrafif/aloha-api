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
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterRequestDto } from 'src/auth/auth.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  AddJobRequest,
  JobAssignRequestDto,
  UpdateUserRequestDto,
} from './user.dto';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { DbexceptionFilter } from 'src/utils/dbexception.filter';
import { UserJobService } from 'src/user-job/user-job.service';
import { request } from 'http';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private userService: UserService,
    private jobService: UserJobService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getCurrentUser(@Request() request) {
    return this.userService.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() request, @Body() body: UpdateUserRequestDto) {
    const user: UserEntity = request.user;
    return this.userService.updateProfile(user, body);
  }

  @Get('job')
  getJobList() {
    return this.jobService.getJobList();
  }

  @Get('job/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getJobAgents(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.getJobAgents(id);
  }

  @Post('job')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  addJob(@Body() body: AddJobRequest) {
    return this.jobService.addJob(body);
  }

  @Put('profile_image')
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(JwtAuthGuard)
  updateProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() request,
  ) {
    const user: UserEntity = request.user;
    return this.userService.updateProfilePhoto(file, user);
  }

  @Put('job/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  assignAgentToJob(@Body() jobAssignBody: JobAssignRequestDto) {
    return this.userService.assignAgentToJob(jobAssignBody);
  }
}
