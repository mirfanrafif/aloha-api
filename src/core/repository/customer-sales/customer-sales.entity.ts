import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity()
export class CustomerSales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerNumber: string;

  @ManyToOne(() => UserEntity, (user) => user.customer)
  sales: UserEntity;

  @Column({ type: 'datetime' })
  created_at: string;
}
