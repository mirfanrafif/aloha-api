import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Customer } from 'src/customer/customer.dto';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { AddCustomerRequest } from './user.dto';
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
  async getCustomerBySalesId(@Request() request): Promise<ApiResponse<any>> {
    const result = await this.userService.getCustomerBySalesId(request.user.id);
    return result;
  }
}
