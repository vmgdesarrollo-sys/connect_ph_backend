import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string; // 'ADMIN', 'RESIDENT', 'GUARD'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  scopes: string; // Permisos en formato string o JSON

  @Column({ default: true })
  is_active: boolean;
}