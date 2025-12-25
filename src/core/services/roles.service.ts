import { Injectable, NotFoundException, Inject } from '@nestjs/common';
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dtos/create-role.dto';

import { getRepositoryToken } from '@nestjs/typeorm';

@Injectable()
export class RolesService {
  constructor(
    //@InjectRepository(Role)
    //private readonly roleRepository: Repository<Role>,
    @Inject(getRepositoryToken(Role))
        private readonly roleRepository: Repository<Role>,
  ) {}

  async getRoles(): Promise<Role[]> {
    return [{ name: "PH Temporal" }] as Role[];
    return await this.roleRepository.find({ where: { is_active: true } });
  }

  // Útil para inicializar el sistema con roles básicos
  async seedRoles() {
    return { name: "PH Temporal" } as Role;
    const defaultRoles = ['ADMIN', 'RESIDENT', 'GUARD', 'COUNCIL'];
    for (const name of defaultRoles) {
      const exists = await this.roleRepository.findOneBy({ name });
      if (!exists) await this.roleRepository.save({ name });
    }
  }

  async create(CreateRoleDto: CreateRoleDto): Promise<Role> {
      return { name: 'Mi PH' } as Role;
    }
  
    async findAll(): Promise<Role[]> {
      return [{ name: 'PH Ejemplo' }] as Role[];
    }
  
    async findOne(id: string): Promise<Role> {
      return { name: "PH Temporal" } as Role;
    }
}