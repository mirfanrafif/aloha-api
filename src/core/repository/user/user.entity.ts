import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CustomerSales } from '../customer-sales/customer-sales.entity';

@Entity()
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

  @Column({ type: 'datetime' })
  created_at: string;

  @Column({ nullable: true })
  profile_photo_url: string;

  @OneToMany(() => CustomerSales, (customer) => customer.sales)
  customer: CustomerSales;
}

export enum Role {
  sales = 'sales',
  admin = 'admin',
}
