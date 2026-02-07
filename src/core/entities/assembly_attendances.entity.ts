import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { QaEntry } from './qa_entries.entity';
import { Vote } from './votes.entity';
import { Assembly } from './assemblies.entity';
import { UnitAssignment } from './unit_assignment.entity';

@Entity('assembly_attendances')
export class AssemblyAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assemblies_id: string;

  @ManyToOne(() => Assembly, (assembly) => assembly.attendances)
  @JoinColumn({ name: 'assemblies_id' })
  assembly: Assembly;

  @Column({ type: 'uuid' })
  unit_assignments_id: string;

  @ManyToOne(() => UnitAssignment, (unitAssignment) => unitAssignment.attendances)
  @JoinColumn({ name: 'unit_assignments_id' })
  unitAssignment: UnitAssignment;

  @Column({ type: 'timestamp', nullable: true })
  arrival_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  departure_at: Date;

  @Column({ default: true })
  is_present: boolean;

  @Column({ type: 'uuid', nullable: true })
  proxy_file_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => QaEntry, (qaEntry) => qaEntry.assemblyAttendance)
  qaEntries: QaEntry[];

  @OneToMany(() => Vote, (vote) => vote.assemblyAttendance)
  votes: Vote[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}