import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageEntity } from '../message/message.entity';
import { CustomerAgent } from '../customer-agent/customer-agent.entity';
import { UserJobEntity } from '../user-job/user-job.entity';
import { MessageTemplateEntity } from '../message-template/message-template.entity';

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({
    unique: true,
  })
  username: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  role: Role;

  @Column({ nullable: true })
  profile_photo: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @OneToMany(() => CustomerAgent, (customer) => customer.agent)
  customer: CustomerAgent[];

  @OneToMany(() => MessageEntity, (message) => message.agent)
  messages: MessageEntity[];

  @OneToMany(() => UserJobEntity, (job) => job.agent)
  job: UserJobEntity[];

  @OneToMany(() => MessageTemplateEntity, (template) => template.user)
  templates: MessageTemplateEntity[];
}

export type UserEntityType = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  profile_photo: string;
  created_at: Date;
  updated_at: Date;
};

export enum Role {
  agent = 'agent',
  admin = 'admin',
  sistem = 'sistem',
}
