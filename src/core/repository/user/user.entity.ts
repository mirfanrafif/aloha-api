import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageEntity } from '../message/message.entity';
import { CustomerAgent } from '../customer-agent/customer-agent.entity';
import { UserJobEntity } from '../user-job/user-job.entity';

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
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  role: Role;

  @Column({ nullable: true })
  profile_photo: string;

  @CreateDateColumn({ type: 'timestamp', default: 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: 'NOW()' })
  updated_at: Date;

  @OneToMany(() => CustomerAgent, (customer) => customer.agent)
  customer: CustomerAgent[];

  @OneToMany(() => MessageEntity, (message) => message.agent)
  messages: MessageEntity[];

  @ManyToOne(() => UserJobEntity, (category) => category.agents)
  job: UserJobEntity;
}

export enum Role {
  agent = 'agent',
  admin = 'admin',
}
