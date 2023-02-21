import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobEntity } from '../job/job.entity';
import { UserEntity } from '../user/user.entity';

@Entity({
  name: 'user_job',
})
export class UserJobEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => JobEntity, (job) => job.agents)
  @JoinColumn({ name: 'job_id' })
  job: JobEntity;

  @ManyToOne(() => UserEntity, (user) => user.job)
  @JoinColumn({ name: 'user_id' })
  agent: UserEntity;

  @Column()
  priority: number;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
