import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('unit_assignments')
export class UnitAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  users_id: string;

  @Column()
  roles_id: string;

  @Column({ default: true })
  is_active: boolean;

}