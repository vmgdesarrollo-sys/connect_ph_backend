import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assembly_attendances')
export class AssemblyAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assemblies_id: string;

  @Column({ type: 'uuid' })
  unit_assignments_id: string;

  @Column({ type: 'timestamp', nullable: true })
  arrival_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  departure_at: Date;

  @Column({ default: false })
  is_present: boolean;

  @Column({ type: 'uuid', nullable: true })
  proxy_file_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}