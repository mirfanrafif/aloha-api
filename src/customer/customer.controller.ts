import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/core/repository/user/user.entity';
import { DbexceptionFilter } from 'src/utils/dbexception.filter';
import { DelegateCustomerRequestDto } from './customer.dto';
import { CustomerService } from './customer.service';

@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@UseInterceptors(ClassSerializerInterceptor)
export class CustomerController {
  constructor(private service: CustomerService) {}

  @Post('delegate')
  delegateCustomerToAgent(@Body() body: DelegateCustomerRequestDto) {
    return this.service.delegateCustomerToAgent(body);
  }
}
