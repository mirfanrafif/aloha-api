import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ type: 'datetime' })
  created_at: string;
}
