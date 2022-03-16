import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationEntity } from '../conversation/conversation.entity';
import { CustomerAgent } from '../customer-agent/customer-agent.entity';
import { MessageEntity } from '../message/message.entity';
import { UserEntity } from '../user/user.entity';

@Entity('customer')
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  phoneNumber: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @OneToOne(() => ConversationEntity, (conversation) => conversation.customer)
  conversation: ConversationEntity;

  @OneToMany(() => MessageEntity, (message) => message.customer)
  messages: MessageEntity[];

  @OneToMany(() => CustomerAgent, (agent) => agent.customer)
  agent: CustomerAgent[];
}