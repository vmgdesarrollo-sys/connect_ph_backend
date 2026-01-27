import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity('phs')
export class Ph {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name?: string;

  @Column({ unique: true, nullable: true })
  tax_id: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone_number?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  logo_url?: string;

  @Column({ nullable: true })
  legal_representative?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  stratum?: string;

  @Column({ nullable: true })
  number_of_towers?: string;

  @Column({ nullable: true })
  amount_of_real_estate?: string;

  @Column({ nullable: true })
  horizontal_property_regulations?: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}