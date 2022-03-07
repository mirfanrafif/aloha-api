import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
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
}

export enum Role {
  sales = 'sales',
  admin = 'admin',
}
