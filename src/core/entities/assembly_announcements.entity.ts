import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assembly } from './assemblies.entity';
import { User } from './user.entity';

@Entity('assembly_announcements')
export class AssemblyAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assemblies_id: string;

  @ManyToOne(() => Assembly, (assembly) => assembly.announcements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assemblies_id' })
  assembly: Assembly;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 50, default: 'Informativo' }) // Informativo, Urgente, etc.
  type: string;

  @Column({ default: false })
  is_sticky: boolean;
  
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