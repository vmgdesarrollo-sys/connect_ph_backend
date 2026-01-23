import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('assemblies')
export class Assembly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: true })
  is_active: boolean;

}