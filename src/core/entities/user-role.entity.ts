import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' }) // Esto crea la columna user_id en la DB
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' }) // Esto crea la columna role_id en la DB
  role: Role;
}