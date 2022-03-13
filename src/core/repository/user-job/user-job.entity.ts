import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'user_job' })
export class UserJobEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @CreateDateColumn({ type: 'timestamp', default: 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: 'NOW()' })
  updated_at: Date;

  @OneToMany(() => UserEntity, (user) => user.job)
  agents: UserEntity[];
}
