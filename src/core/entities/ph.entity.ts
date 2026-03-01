import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from './unit.entity';
import { Assembly } from './assemblies.entity';
import { User } from './user.entity';

@Entity('phs')
export class Ph {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, nullable: true, length: 20 })
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

  @Column({ type:'int', nullable: true })
  number_of_towers?: number;

  @Column({ type:'int',nullable: true })
  amount_of_real_estate?: number;

  @Column({ nullable: true })
  horizontal_property_regulations?: string;

  @OneToMany(() => Unit, (unit) => unit.ph)
  units: Unit[];

  @OneToMany(() => Assembly, (assembly) => assembly.ph)
  assemblies: Assembly[];

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
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}