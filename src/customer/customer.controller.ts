import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/core/repository/user/user.entity';
import { DelegateCustomerRequestDto } from './customer.dto';
import { CustomerService } from './customer.service';

@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.admin)
@UseInterceptors(ClassSerializerInterceptor)
export class CustomerController {
  constructor(private service: CustomerService) {}

  @Post('delegate')
  delegateCustomerToAgent(@Body() body: DelegateCustomerRequestDto) {
    return this.service.delegateCustomerToAgent(body);
  }

  @Get()
  getAllCustomer(@Query('page', ParseIntPipe) page: number) {
    return this.service.getAllCustomersFromCrm(page);
  }
}
