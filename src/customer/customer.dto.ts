import { IsNotEmpty, IsNumber } from 'class-validator';

export type Customer = {
  id: number;
  phoneNumber: string;
};

export class DelegateCustomerRequestDto {
  @IsNotEmpty()
  customerNumber: string;

  @IsNotEmpty()
  @IsNumber()
  agentId: number;
}
