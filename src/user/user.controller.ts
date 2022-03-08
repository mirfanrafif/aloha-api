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
    return request.user;
  }

  @Get('customer')
  async getCustomerBySalesId(
    @Request() request,
    @Query('page') page?: number,
  ): Promise<ApiResponse<any>> {
    const result = await this.userService.getCustomerBySalesId(
      request.user.id,
      page !== undefined ? page : 0,
    );
    return result;
  }
}
