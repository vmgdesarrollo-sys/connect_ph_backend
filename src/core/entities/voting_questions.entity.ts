import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('voting_questions')
export class VotingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agenda_id: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, default: 'Coeficiente' })
  type: string;

  @Column({ length: 50, default: 'Pendiente' })
  status: string;

  @Column({ length: 50, default: 'Única' })
  result_type: string;

  @Column({ type: 'int', default: 1 })
  min_selections: number;

  @Column({ type: 'int', default: 1 })
  max_selections: number;

  @Column({ type: 'timestamp', nullable: true })
  opened_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}