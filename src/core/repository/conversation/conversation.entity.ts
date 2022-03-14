import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'conversations' })
export class ConversationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerNumber: string;

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
