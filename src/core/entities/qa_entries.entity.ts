import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('qa_entries')
export class QaEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assembly_attendances_id: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ default: false })
  is_moderated: boolean;

  @Column({ length: 50, default: 'Pendiente' })
  status: string;

  @Column({ type: 'text', nullable: true })
  answer_text: string;

  @Column({ type: 'timestamp', nullable: true })
  answered_at: Date;

  @Column({ default: false })
  is_private: boolean;

  @Column({ type: 'int', default: 0 })
  upvotes: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}