import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Ph } from './ph.entity';
import { UnitAssignment } from './unit_assignment.entity';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, nullable: true })
  block?: string;

  @Column({ length: 20 })
  unit_number: string;

  @Column({ length: 30, nullable: true })
  type?: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  coefficient?: number;

  @Column({ type: 'int', nullable: true })
  floor?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area?: number;

  @Column({ nullable: true })
  tax_responsible?: string;

  @Column({ nullable: true })
  tax_responsible_document_type?: string;

  @Column({ nullable: true })
  tax_responsible_document?: string;

  @Column({ type: 'uuid' })
  phs_id: string;

  @ManyToOne(() => Ph, (ph) => ph.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phs_id' })
  ph: Ph;

  @OneToMany(() => UnitAssignment, (assignment) => assignment.unit)
  assignments: UnitAssignment[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}