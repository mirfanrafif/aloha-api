import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({
  name: 'customer_agent',
})
export class CustomerAgent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerNumber: string;

  @ManyToOne(() => UserEntity, (user) => user.customer)
  agent: UserEntity;

  @CreateDateColumn({ type: 'timestamp', default: 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: 'NOW()' })
  updated_at: Date;
}
