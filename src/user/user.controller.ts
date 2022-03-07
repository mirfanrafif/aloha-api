import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CustomerService } from 'src/customer/customer.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private customerService: CustomerService) {}

  @Get('profile')
  getCurrentUser(@Request() request) {
    return request.user;
  }

  @Get('customer')
  getCustomerBySalesId(@Request() request) {
    return this.customerService.getCustomerByIdSalesId(request.user.id);
  }
}
