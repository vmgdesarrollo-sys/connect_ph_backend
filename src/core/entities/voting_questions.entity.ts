import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Agenda } from './agenda.entity';
import { QuestionOption } from './questions_options.entity';
import { Vote } from './votes.entity';
import { User } from './user.entity';

@Entity('voting_questions')
export class VotingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agenda_id: string;

  @ManyToOne(() => Agenda, (agenda) => agenda.votingQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agenda_id' })
  agenda: Agenda;

  @OneToMany(() => QuestionOption, (option) => option.votingQuestion)
  options: QuestionOption[];

  @OneToMany(() => Vote, (vote) => vote.votingQuestion)
  votes: Vote[];

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

  @Column({ default: false })
  is_active: boolean;
  
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