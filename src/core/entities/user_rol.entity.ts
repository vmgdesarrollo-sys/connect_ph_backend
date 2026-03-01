import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { UnitAssignment } from './unit_assignment.entity';

@Entity('user_roles')
export class UserRol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  users_id: string;

  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'users_id' })
  user: User;

  @Column({ type: 'uuid' })
  roles_id: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roles_id' })
  role: Role;

  @OneToMany(() => UnitAssignment, (assignment) => assignment.userRol)
  unitAssignments: UnitAssignment[];

  @Column({ default: true })
  is_active: boolean;

  
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;
  
  @Column({ type: 'uuid', nullable: true })
  updated_by?: string;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser?: User;

  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;

}