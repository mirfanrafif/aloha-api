import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerEntity } from '../customer/customer.entity';

@Entity({ name: 'conversations' })
export class ConversationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => CustomerEntity, (customer) => customer.conversation)
  customer: CustomerEntity;

  @Column()
  status: ConversationStatus;

  @CreateDateColumn({ name: 'created_at', default: 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', default: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

export enum ConversationStatus {
  STARTED = 'started',
  CONNECTED = 'connected',
  ENDED = 'ended',
  CANCELED = 'canceled',
}
