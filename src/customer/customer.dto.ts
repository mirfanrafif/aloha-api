import { IsNotEmpty, IsNumber } from 'class-validator';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { MessageResponseDto } from 'src/messages/message.dto';

export type Customer = {
  id: number;
  phoneNumber: string;
};

export class DelegateCustomerRequestDto {
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  agentId: number;
}

export class CustomerAgentArrDto {
  id: number;

  customer: CustomerEntity;

  agent: UserEntity[];

  created_at: Date;

  updated_at: Date;
}

export class CustomerAgentResponseDto {
  id: number;

  customer: CustomerEntity;

  agent: UserEntity[];

  lastMessage?: MessageResponseDto;

  created_at: Date;

  updated_at: Date;
}
