import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getCurrentUser(@Request() request) {
    return this.userService.getCurrentUser(request.user.id);
  }

  @Get('customer')
  async getCustomerByAgentId(
    @Request() request,
    @Query('last_customer_id') lastCustomerId?: number,
  ): Promise<ApiResponse<any>> {
    const result = await this.userService.getCustomerByAgentId(
      request.user,
      lastCustomerId,
    );
    return result;
  }
}
