import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Module({
  providers: [CustomerService],
  imports: [HttpModule],
  exports: [CustomerService],
})
export class CustomerModule {}
