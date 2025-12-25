import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity'; // Asegúrate que este archivo exista

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: true })
  is_active: boolean;

  // Esta no es una columna en la DB, es una referencia para NestJS
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[]; 
}