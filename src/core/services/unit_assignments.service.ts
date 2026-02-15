import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { UnitAssignment } from "../entities/unit_assignment.entity";
import { UserRol } from "../entities/user_rol.entity";
import { CreateAssingmentUnitDto } from "../dtos/payload/unit_assignment-payload.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar las asignaciones de unidades a roles de usuario
@Injectable()
export class UnitAssignmentsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(UserRol)
    private readonly userRolRepository: Repository<UserRol>,
    @InjectRepository(UnitAssignment)
    private readonly unitAssignmentRepository: Repository<UnitAssignment>
  ) {}
// Asignar una unidad a un rol de usuario
  async assingRol(id: string, createAssingmentUnitDto: CreateAssingmentUnitDto): Promise<any> {
    // Validar que el user_role existe
    const userRole = await this.userRolRepository.findOne({ 
      where: { id, is_active: true } 
    });
    
    if (!userRole) {
      throw new NotFoundException(
        this.i18n.t("user_roles.NOT_FOUND", { lang, args: { id } })
      );
    }

    // Validar que el user_role no tenga ya asignada esta unidad
    const existingAssignment = await this.unitAssignmentRepository.findOne({
      where: { 
        user_roles_id: id, 
        units_id: createAssingmentUnitDto.units_id,
        is_active: true 
      }
    });

    if (existingAssignment) {
      throw new ConflictException(
        this.i18n.t("unit_assignments.ALREADY_ASSIGNED", { 
          lang, 
          args: { units_id: createAssingmentUnitDto.units_id } 
        })
      );
    }

    // Crear la asignación de unidad
    const unitAssignment = this.unitAssignmentRepository.create({
      ...createAssingmentUnitDto,
      user_roles_id: id
    });
    const saved = await this.unitAssignmentRepository.save(unitAssignment);

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('unit_assignments.MSG_CREATE', {lang, args: {},}),
      data: saved
    };
  }
// Obtener las asignaciones de unidades por user_role ID
  async getRolPerUserId(id: string): Promise<any> {
    // Verificar si el user_role tiene asignaciones de unidades
    const unitAssignments = await this.unitAssignmentRepository.find({
      where: { user_roles_id: id, is_active: true }
    });

    // Si no tiene asignaciones, el user_role no está asignado a ninguna unidad
    if (unitAssignments.length === 0) {
      throw new NotFoundException(
        this.i18n.t("unit_assignments.NOT_FOUND", { lang, args: { id } })
      );
    }

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('unit_assignments.MSG_GET', {lang, args: {},}),
      data: unitAssignments
    };
  }

}
