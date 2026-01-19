import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  block?: string;

  @Column({ unique: true, nullable: true })
  unit_number: string;

  @Column({ type: 'text', nullable: true })
  type?: string;

  @Column({ nullable: true })
  coefficient?: string;

  @Column({ nullable: true })
  floor?: string;

  @Column({ nullable: true })
  area?: string;

  @Column({ nullable: true })
  tax_responsible?: string;

  @Column({ nullable: true })
  tax_responsible_document_type?: string;

  @Column({ nullable: true })
  tax_responsible_document?: string;

  @Column({ nullable: true })
  phs_id?: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}