import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('user_roles')
export class UserRol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  users_id: string;

  @Column()
  roles_id: string;

  @Column({ default: true })
  is_active: boolean;

}