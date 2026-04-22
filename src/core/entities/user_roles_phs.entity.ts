import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ph } from './ph.entity';
import { UserRol } from './user_rol.entity';
import { User } from './user.entity';

@Entity('user_roles_phs')
export class UserRolePh {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  phs_id: string;

  @ManyToOne(() => Ph, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phs_id' })
  ph: Ph;

  @Column({ type: 'uuid' })
  user_roles_id: string;

  @ManyToOne(() => UserRol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_roles_id' })
  userRole: UserRol;

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
