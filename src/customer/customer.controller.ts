import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  Param,
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

  @Post('delegate')
  delegateCustomerToAgent(@Body() body: DelegateCustomerRequestDto) {
    return this.service.delegateCustomerToAgent(body);
  }

  @Get()
  getAllCustomer(
    @Query('search') search: string,
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.service.searchCustomerFromCrm(search, page);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  startConversationWithCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Request() request,
  ) {
    return this.service.startMessageWithCustomer(id, request.user);
  }
}
