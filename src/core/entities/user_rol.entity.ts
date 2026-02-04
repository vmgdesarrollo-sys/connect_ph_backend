import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  users_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'users_id' })
  user: User;

  @Column({ type: 'uuid' })
  roles_id: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roles_id' })
  role: Role;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;

}