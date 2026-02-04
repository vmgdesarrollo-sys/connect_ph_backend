import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('unit_assignments')
export class UnitAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  units_id: string;

  @Column()
  user_roles_id: string;

  @Column({ default: false })
  is_main_resident: boolean;

  @Column({ default: false })
  can_vote: boolean;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}