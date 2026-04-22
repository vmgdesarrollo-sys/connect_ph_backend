import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { VotingQuestion } from './voting_questions.entity';
import { Vote } from './votes.entity';

@Entity('questions_options')
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  question_id: string;

  @ManyToOne(() => VotingQuestion, (votingQuestion) => votingQuestion.options, { onDelete: 'CASCADE' }
)
  @JoinColumn({ name: 'question_id' })
  votingQuestion: VotingQuestion;

  @OneToMany(() => Vote, (vote) => vote.questionOption)
  votes: Vote[];

  @Column({ length: 255 })
  option_text: string;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}