import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Unit } from './unit.entity';
import { UserRol } from './user_rol.entity';
import { AssemblyAttendance } from './assembly_attendances.entity';
import { User } from './user.entity';

@Entity('unit_assignments')
export class UnitAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  units_id: string;

  @ManyToOne(() => Unit, (unit) => unit.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'units_id' })
  unit: Unit;

  @Column({ type: 'uuid' })
  user_roles_id: string;

  @ManyToOne(() => UserRol, (userRol) => userRol.unitAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_roles_id' })
  userRol: UserRol;

  @OneToMany(() => AssemblyAttendance, (attendance) => attendance.unitAssignment)
  attendances: AssemblyAttendance[];

  @Column({ default: false })
  is_main_resident: boolean;

  @Column({ default: false })
  can_vote: boolean;

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