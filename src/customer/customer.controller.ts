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
@UseInterceptors(ClassSerializerInterceptor)
export class CustomerController {
  constructor(private service: CustomerService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post('delegate')
  delegateCustomerToAgent(@Body() body: DelegateCustomerRequestDto) {
    return this.service.delegateCustomerToAgent(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllCustomer(
    @Query('search') search: string,
    @Query('page') page?: number,
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

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  getCustomerCategories() {
    return this.service.getCustomerCategories();
  }

  @Get('interests')
  @UseGuards(JwtAuthGuard)
  getCustomerInterests() {
    return this.service.getCustomerInterests();
  }

  @Get('types')
  @UseGuards(JwtAuthGuard)
  getCustomerTypes() {
    return this.service.getCustomerTypes();
  }
}
