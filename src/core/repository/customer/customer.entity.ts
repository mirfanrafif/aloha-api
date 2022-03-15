import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationEntity } from '../conversation/conversation.entity';
import { MessageEntity } from '../message/message.entity';

@Entity('customer')
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({ type: 'datetime', default: 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', default: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => ConversationEntity, (conversation) => conversation.customer)
  conversation: ConversationEntity;

  @OneToMany(() => MessageEntity, (message) => message.customer)
  messages: MessageEntity[];
}
