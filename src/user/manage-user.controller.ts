import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/core/repository/user/user.entity';
import { ChangeSalesPasswordDto, UpdateUserRequestDto } from './user.dto';
import { UserService } from './user.service';

@Controller('user/manage')
@UseInterceptors(ClassSerializerInterceptor)
export class UserManageController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Put(':id')
  editSalesProfile(
    @Param('id', ParseIntPipe) agentId: number,
    @Body() newData: UpdateUserRequestDto,
  ) {
    return this.userService.updateUser(agentId, newData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Put(':id/password')
  editSalesPassword(
    @Param('id', ParseIntPipe) agentId: number,
    @Body() request: ChangeSalesPasswordDto,
  ) {
    return this.userService.changeSalesPassword(request, agentId);
  }
}
