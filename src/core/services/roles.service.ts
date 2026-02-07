import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { CreateRoleDto } from "../dtos/payload/rol-payload.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class RolesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}
 // Crear un nuevo rol
  async create(CreateRoleDto: CreateRoleDto): Promise<any> {
    const newRole = this.roleRepository.create(CreateRoleDto);
    const savedRole = await this.roleRepository.save(newRole);
    
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('roles.MSG_CREATE', {lang, args: {},}),
      data: savedRole,
    };
  }
// Listar todos los roles activos
  async findAll(_fields?: string, _where?: string): Promise<any> {
    const roles = await this.roleRepository.find({ where: { is_active: true } });
    
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('roles.MSG_LIST', {lang, args: {},}),
      data: roles,
      properties: {
        total_items: roles.length,
        items_per_page: roles.length,
        current_page: 1,
        total_pages: 1,
      },
    };
  }
// Obtener detalle de un rol por ID
  async findOne(id: string): Promise<any> {
    const role = await this.roleRepository.findOne({ where: { id, is_active: true } });
    
    if (!role) {
      throw new NotFoundException(this.i18n.t('roles.MSG_NOT_FOUND', {lang, args: {id}}));
    }
    
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('roles.MSG_GET', {lang, args: {},}),
      data: role,
    };
  }
// Eliminar un rol por ID (soft delete)
  async delete(id: string): Promise<any> {
    const role = await this.roleRepository.findOne({ where: { id } });
    
    if (!role) {
      throw new NotFoundException(this.i18n.t('roles.MSG_NOT_FOUND', {lang, args: {id}}));
    }
    
    role.is_active = false;
    await this.roleRepository.save(role);
    
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('roles.MSG_DELETE', {lang, args: {id},}),
    };
  }
// Actualizar un rol por ID
  async update(id: string, CreateRoleDto: CreateRoleDto): Promise<any> {
    const role = await this.roleRepository.findOne({ where: { id, is_active: true } });
    
    if (!role) {
      throw new NotFoundException(this.i18n.t('roles.MSG_NOT_FOUND', {lang, args: {id}}));
    }

    Object.assign(role, CreateRoleDto);
    const updatedRole = await this.roleRepository.save(role);

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('roles.MSG_UPDATE', {lang, args: {id},}),
      data: updatedRole,
    };
  }
}
