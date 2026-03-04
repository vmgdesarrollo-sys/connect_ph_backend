import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UnitAssignment } from './unit_assignment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({length: 100})
  first_name: string;

  @Column({length: 100})
  last_name: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 255, select: false, nullable: true })
  password?: string;

  @Column({ length: 20, nullable: true })
  document_type: string;

  @Column({ length: 50, nullable: true })
  document_number: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Column({ length: 255, nullable: true })
  avatar_url: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ length: 50, nullable: true })
  type_person: string;

  @Column({ length: 20, nullable: true })
  gender: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UnitAssignment, (unitAssignment) => unitAssignment.user)
  unitAssignments: UnitAssignment[];
}