import { Injectable, NotFoundException, Inject } from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { CreateRoleDto } from "../dtos/payload/create-rol.dto";
import { getRepositoryToken } from "@nestjs/typeorm";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class RolesService {
  constructor(
    //@InjectRepository(Role)
    //private readonly roleRepository: Repository<Role>,
    @Inject(getRepositoryToken(Role))
    private readonly roleRepository: Repository<Role>
  ) {}

  async create(CreateRoleDto: CreateRoleDto): Promise<any> {
    return {
      status: "success",
      message: "Rol creado exitosamente.",
      data: {
        id: "1",
        ...CreateRoleDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }

  async findAll(_fields?:string, _where?:string): Promise<any> {
    return [{ name: "PH Ejemplo" }] as Role[];
  }

  async findOne(id: string): Promise<any> {
    return {
      status: "success",
      message: "Detalle del rol",
      data: {
        id: "1",
        name: "admin",
        description: "rol de administrador",
        scopes: "admin/read",
        is_active: true,
        created_at: "2025-12-25T13:45:00Z",
      }
    }
  }

  async delete(id: string): Promise<any> {
    return {
      status: "success",
      message: "Rol {id} eliminada exitosamente",
    };
  }

  async update(id: string, CreateRoleDto: CreateRoleDto): Promise<any> {
    return {
      status: "success",
      message: "Rol actualizado exitosamente.",
      data: {
        id: "1",
        ...CreateRoleDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }
}
