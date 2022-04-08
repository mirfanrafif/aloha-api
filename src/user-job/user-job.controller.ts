import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/core/repository/user/user.entity';
import { UserJobService } from 'src/user-job/user-job.service';
import { AddJobRequest, JobAssignRequestDto } from 'src/user/user.dto';

@Controller('user/job')
@UseInterceptors(ClassSerializerInterceptor)
export class UserJobController {
  constructor(private jobService: UserJobService) {}
  @Get()
  getJobList() {
    return this.jobService.getJobList();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  getJobAgents(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.getJobAgents(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  addJob(@Body() body: AddJobRequest) {
    return this.jobService.addJob(body);
  }

  @Put('assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  assignAgentToJob(@Body() jobAssignBody: JobAssignRequestDto) {
    return this.jobService.assignAgentToJob(jobAssignBody);
  }
}
