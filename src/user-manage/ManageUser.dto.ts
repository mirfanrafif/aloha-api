import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

export class DeleteUserRequest {
  @IsNotEmpty()
  salesId: number;

  @ValidateNested({ each: true })
  delegatedSales: DelegateCustomerSalesItem[];
}

export class DelegateCustomerSalesItem {
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  salesId: number;
}
