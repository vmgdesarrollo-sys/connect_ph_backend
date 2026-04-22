import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Assembly } from './assemblies.entity';
import { VotingQuestion } from './voting_questions.entity';
import { User } from './user.entity'

@Entity('agenda')
export class Agenda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assembly_id: string;

  @ManyToOne(() => Assembly, (assembly) => assembly.agendaItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assembly_id' })
  assembly: Assembly;

  @OneToMany(() => VotingQuestion, (votingQuestion) => votingQuestion.agenda)
  votingQuestions: VotingQuestion[];

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  is_votable: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  required_quorum: number;

  @Column({ default: true })
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