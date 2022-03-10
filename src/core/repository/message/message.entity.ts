import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @ManyToOne(() => UserEntity, (user) => user.messages)
  agent: UserEntity;

  @Column()
  customerNumber: string;

  @Column()
  status: MessageStatus;

  @Column({ type: 'datetime' })
  created_at: string;

  @Column()
  type: MessageType;
}

export enum MessageStatus {
  sent = 'sent',
  read = 'read',
  cancel = 'cancel',
  received = 'received',
  reject = 'reject',
  pending = 'pending',
}

export enum MessageType {
  incoming = 'incoming',
  outgoing = 'outgoing',
}
