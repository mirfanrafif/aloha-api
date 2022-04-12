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

  unread: number;

  lastMessage: MessageResponseDto | null;

  created_at: Date;

  updated_at: Date;
}

export interface CustomerResponse {
  data: CrmCustomer[];
  meta: Meta;
  links: Links;
}

export interface CrmCustomer {
  status: Status;
  is_active: boolean;
  id: number;
  created_at: Date;
  updated_at: Date;
  code: null;
  title: Title | null;
  first_name: string;
  last_name: null | string;
  balance: string;
  email: null | string;
  address: null | string;
  shipping_address: null | string;
  notes: null | string;
  dob: null;
  telephones: string;
  users: User[];
  types: Type[];
  full_name: string;
  telephones_array: string[];
}

export enum Status {
  Kontak = 'Kontak',
}

export enum Title {
  Bapak = 'Bapak',
  Ibu = 'Ibu',
}

export interface Type {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  system_id?: number;
}
export interface User {
  id: number;
  created_at: Date;
  updated_at: Date;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  is_active: boolean;
  role: Type;
  full_name: string;
}

export interface Links {
  current: string;
  next: string;
  last: string;
}

export interface Meta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  sortBy: Array<string[]>;
}
