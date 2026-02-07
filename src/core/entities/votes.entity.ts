import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VotingQuestion } from './voting_questions.entity';
import { QuestionOption } from './questions_options.entity';
import { AssemblyAttendance } from './assembly_attendances.entity';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  voting_questions_id: string;

  @ManyToOne(() => VotingQuestion, (votingQuestion) => votingQuestion.votes)
  @JoinColumn({ name: 'voting_questions_id' })
  votingQuestion: VotingQuestion;

  @Column({ type: 'uuid' })
  questions_options_id: string;

  @ManyToOne(() => QuestionOption, (questionOption) => questionOption.votes)
  @JoinColumn({ name: 'questions_options_id' })
  questionOption: QuestionOption;

  @Column({ type: 'uuid' })
  assembly_attendances_id: string;

  @ManyToOne(() => AssemblyAttendance, (attendance) => attendance.votes)
  @JoinColumn({ name: 'assembly_attendances_id' })
  assemblyAttendance: AssemblyAttendance;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  coefficient_at_voting: number;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;
}