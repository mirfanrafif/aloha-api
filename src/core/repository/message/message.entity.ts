import { MessageType } from 'src/messages/message.dto';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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
  customerNumber: string;

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

  @CreateDateColumn({ type: 'timestamp', default: 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: 'NOW()' })
  updated_at: Date;
}

export enum MessageStatus {
  sent = 'sent',
  read = 'read',
  cancel = 'cancel',
  received = 'received',
  reject = 'reject',
  pending = 'pending',
}
