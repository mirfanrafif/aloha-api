import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerEntity } from '../customer/customer.entity';

@Entity({ name: 'conversations' })
export class ConversationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => CustomerEntity)
  @JoinColumn()
  customer: CustomerEntity;

  @Column()
  status: ConversationStatus;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}

export enum ConversationStatus {
  STARTED = 'started',
  CONNECTED = 'connected',
  ENDED = 'ended',
  CANCELED = 'canceled',
}
