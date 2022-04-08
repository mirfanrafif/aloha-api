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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  AddJobRequest,
  ChangePasswordDto,
  EditProfileRequestDto,
  JobAssignRequestDto,
  UpdateUserRequestDto,
} from './user.dto';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserJobService } from 'src/user-job/user-job.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RegisterRequestDto } from 'src/auth/auth.dto';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private userService: UserService,
    private jobService: UserJobService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getAllUsers() {
    return this.userService.getAllUsers();
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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getCurrentUser(@Request() request) {
    return this.userService.getCurrentUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() request, @Body() body: EditProfileRequestDto) {
    const user: UserEntity = request.user;
    return this.userService.editProfile(user, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Put(':id')
  editSalesProfile(
    @Param('id', ParseIntPipe) agentId: number,
    @Body() newData: UpdateUserRequestDto,
  ) {
    return this.userService.updateUser(agentId, newData);
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

  @Put(':id/profile_image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: 'uploads/profile_pictures',
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

  @Get('profile_image/:file_name')
  getProfilePhoto(@Param('file_name') filename: string, @Res() res) {
    res.sendFile(filename, { root: 'uploads/profile_pictures' });
  }
}
