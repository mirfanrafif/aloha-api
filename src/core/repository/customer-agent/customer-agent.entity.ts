import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerEntity } from '../customer/customer.entity';
import { UserEntity } from '../user/user.entity';

@Entity({
  name: 'customer_agent',
})
export class CustomerAgent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerEntity, (customer) => customer.agent)
  customer: CustomerEntity;

  @ManyToOne(() => UserEntity, (user) => user.customer)
  agent: UserEntity;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
