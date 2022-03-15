import { MessageType } from 'src/messages/message.dto';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerEntity } from '../customer/customer.entity';
import { UserEntity } from '../user/user.entity';

@Entity({
  name: 'message',
})
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  messageId: string;

  @Column()
  message: string;

  @Column()
  status: MessageStatus;

  @Column({ nullable: true })
  file: string;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  agent: UserEntity;

  @Column()
  type: MessageType;

  @Column()
  fromMe: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.messages)
  customer: CustomerEntity;
}

export enum MessageStatus {
  SENT = 'sent',
  READ = 'read',
  CANCEL = 'cancel',
  RECEIVED = 'received',
  REJECT = 'reject',
  PENDING = 'pending',
}
