import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  voting_questions_id: string;

  @Column({ type: 'uuid' })
  questions_options_id: string;

  @Column({ type: 'uuid' })
  assembly_attendances_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  coefficient_at_voting: number;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;
}