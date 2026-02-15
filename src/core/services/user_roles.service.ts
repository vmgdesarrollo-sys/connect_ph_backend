import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from "typeorm";
import { User } from "../entities/user.entity";
import { UserRol } from "../entities/user_rol.entity";
import { Role } from "../entities/role.entity";
import { CreateUserRolDto } from "../dtos/payload/user_rol-payload.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar los roles asignados a los usuarios
@Injectable()
export class UserRolesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRol)
    private readonly userRolRepository: Repository<UserRol>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}
// Asignar roles a un usuario
  async assingRol(id: string, createUserRolDto: CreateUserRolDto): Promise<any> {
    // Validar que el usuario existe
    const user = await this.userRepository.findOne({ 
      where: { id, is_active: true } 
    });
    // Si no existe, lanzar error
    if (!user) {
      throw new NotFoundException(
        this.i18n.t("users.NOT_FOUND", { lang, args: { id } })
      );
    }

    // Buscar los roles por nombre para obtener sus UUIDs
    const roles = await this.roleRepository.find({
      where: { 
        name: In(createUserRolDto.roles),
        is_active: true 
      }
    });

    // Validar que todos los roles existen
    if (roles.length !== createUserRolDto.roles.length) {
      const foundRoleNames = roles.map(r => r.name);
      const notFoundRoles = createUserRolDto.roles.filter(name => !foundRoleNames.includes(name));
      throw new NotFoundException(
        `Los siguientes roles no fueron encontrados: ${notFoundRoles.join(', ')}`
      );
    }

    // Obtener los UUIDs de los roles
    const roleIds = roles.map(r => r.id);

    // Verificar roles ya asignados (evitar duplicados)
    const existingRoles = await this.userRolRepository.find({
      where: { 
        users_id: id,
        is_active: true 
      }
    });
    // Filtrar los roles que ya están asignados
    const existingRoleIds = new Set(existingRoles.map(ur => ur.roles_id));
    const newRoleIds = roleIds.filter(roleId => !existingRoleIds.has(roleId));

    // Crear todas las asignaciones de una vez (batch insert)
    if (newRoleIds.length > 0) {
      const userRoles = newRoleIds.map(roleId => 
        this.userRolRepository.create({
          users_id: id,
          roles_id: roleId
        })
      );
      // Guardar todas las asignaciones de roles nuevas en una sola consulta
      await this.userRolRepository.save(userRoles); 
    }

    // Determinar mensaje según el resultado
    let message: string;
    if (newRoleIds.length === 0) {
      message = this.i18n.t('user_roles.MSG_ALREADY_ASSIGNED', {lang}) || "Los roles ya estaban asignados";
    } else if (roleIds.length - newRoleIds.length > 0) {
      message = this.i18n.t('user_roles.MSG_PARTIAL', {lang}) || "Algunos roles ya estaban asignados";
    } else {
      message = this.i18n.t('user_roles.MSG_CREATE', {lang}) || "Roles asignados correctamente"; 
    }
    // Retornar la respuesta
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: message,
      data: {
        user_id: id,
        roles_assigned: newRoleIds.length,
        roles_already_existed: roleIds.length - newRoleIds.length,
        total_roles: roleIds.length
      }
    };
  }
// Obtener roles asignados a un usuario por su ID
  async getRolPerUserId(id: string): Promise<any> {
    // Obtener user_roles con sus relaciones en 1 sola query
    const userRoles = await this.userRolRepository.find({
      where: { users_id: id, is_active: true },
      relations: ['user', 'role']
    });

    // Si no tiene roles asignados
    if (userRoles.length === 0) {
      throw new NotFoundException(
        this.i18n.t("user_roles.NOT_FOUND", { lang, args: { id } })
      );
    }

    // Mapear los roles
    const rolesData = userRoles.map(userRol => ({
      //user_role_id: userRol.id,
      //role_id: userRol.role.id,
      name: userRol.role.name,
      description: userRol.role.description,
      //assigned_at: userRol.created_at
    }));
    
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('user_roles.MSG_GET', {lang, args: {},}),
      data: {
        user: {
          id: userRoles[0].user.id,
          first_name: userRoles[0].user.first_name,
          last_name: userRoles[0].user.last_name,
          email: userRoles[0].user.email
        },
        roles: rolesData
      }
    };
  }

}
