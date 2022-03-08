import { IsNotEmpty } from 'class-validator';

export class AddCustomerRequest {
  @IsNotEmpty()
  customerId: number;
}
