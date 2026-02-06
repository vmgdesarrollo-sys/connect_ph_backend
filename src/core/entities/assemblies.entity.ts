import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Agenda } from './agenda.entity';
import { AssemblyAnnouncement } from './assembly_announcements.entity';
import { Ph } from './ph.entity';
import { AssemblyAttendance } from './assembly_attendances.entity';

@Entity('assemblies')
export class Assembly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Agenda, (agenda) => agenda.assembly)
  agendaItems: Agenda[];

  @OneToMany(() => AssemblyAnnouncement, (announcement) => announcement.assembly)
  announcements: AssemblyAnnouncement[];

  @OneToMany(() => AssemblyAttendance, (attendance) => attendance.assembly)
  attendances: AssemblyAttendance[];

  @Column({ type: 'uuid' })
  phs_id: string;

  @ManyToOne(() => Ph, (ph) => ph.assemblies)
  @JoinColumn({ name: 'phs_id' })
  ph: Ph;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 50, default: 'Programada' })
  status: string;

  @Column({ type: 'timestamp' })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  finished_at: Date;

  @Column({ nullable: true })
  livekit_room_name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  quorum_requirement: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}