import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Request,
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
@Roles(Role.admin)
@UseInterceptors(ClassSerializerInterceptor)
export class CustomerController {
  constructor(private service: CustomerService) {}

  @Get()
  getCustomerList(
    @Request() request,
    @Query('last_customer_id') lastCustomerId?: number,
  ) {
    return this.service.getCustomerByAgent({
      agent: request.user,
      lastCustomerId,
    });
  }

  @Post('delegate')
  delegateCustomerToAgent(@Body() body: DelegateCustomerRequestDto) {
    return this.service.delegateCustomerToAgent({
      customerNumber: body.customerNumber,
      agentId: body.agentId,
    });
  }
}
