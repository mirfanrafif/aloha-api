import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  salesId: number;

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
