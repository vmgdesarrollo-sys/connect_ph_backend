import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { UnitAssignment } from "../entities/unit_assignment.entity";
import { Unit } from "../entities/unit.entity";
import { User } from "../entities/user.entity";
import { CreateAssingmentUnitDto } from "../dtos/payload/unit_assignment-payload.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar las asignaciones de unidades a usuarios
@Injectable()
export class UnitAssignmentsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(UnitAssignment)
    private readonly unitAssignmentRepository: Repository<UnitAssignment>
  ) {}
// Asignar una unidad a un usuario
  async assingRol(id: string, createAssingmentUnitDto: CreateAssingmentUnitDto): Promise<any> {
    // Validar que el usuario existe
    const user = await this.userRepository.findOne({ 
      where: { id, is_active: true } 
    });
    
    if (!user) {
      throw new NotFoundException(
        this.i18n.t("users.NOT_FOUND", { lang, args: { id } })
      );
    }

    // Validar que la unidad existe
    const unit = await this.unitRepository.findOne({
      where: { id: createAssingmentUnitDto.units_id, is_active: true }
    });

    if (!unit) {
      throw new NotFoundException(
        this.i18n.t("units.NOT_FOUND", { lang, args: { id: createAssingmentUnitDto.units_id } })
      );
    }

    // Validar que el usuario no tenga ya asignada esta unidad
    const existingAssignment = await this.unitAssignmentRepository.findOne({
      where: { 
        user_id: id, 
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
      user_id: id
    });
    const saved = await this.unitAssignmentRepository.save(unitAssignment);

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('unit_assignments.MSG_CREATE', {lang, args: {},}),
      data: saved
    };
  }
// Obtener las asignaciones de unidades por user ID
  async getRolPerUserId(id: string): Promise<any> {
    // Verificar si el usuario tiene asignaciones de unidades
    const unitAssignments = await this.unitAssignmentRepository.find({
      where: { user_id: id, is_active: true }
    });

    // Si no tiene asignaciones, el usuario no está asignado a ninguna unidad
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
