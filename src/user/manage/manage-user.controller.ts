import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/core/repository/user/user.entity';
import { ChangeSalesPasswordDto, UpdateUserRequestDto } from '../user.dto';
import { ManageUserService } from './manage-user.service';

@Controller('user/manage')
@UseInterceptors(ClassSerializerInterceptor)
export class UserManageController {
  constructor(private service: ManageUserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Put(':id')
  editSalesProfile(
    @Param('id', ParseIntPipe) agentId: number,
    @Body() newData: UpdateUserRequestDto,
  ) {
    return this.service.updateUser(agentId, newData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Put(':id/password')
  editSalesPassword(
    @Param('id', ParseIntPipe) agentId: number,
    @Body() request: ChangeSalesPasswordDto,
  ) {
    return this.service.changeSalesPassword(request, agentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get(':id/stats')
  getSalesStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.service.getStats(id, start, end);
  }
}
