import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({
  name: 'message_template',
})
export class MessageTemplateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  template: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: string;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: string;

  @ManyToOne(() => UserEntity, (user) => user.templates)
  @JoinColumn({
    name: 'agent_id',
  })
  user: UserEntity;
}
