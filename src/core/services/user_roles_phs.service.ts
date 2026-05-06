import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { UserRol } from '../entities/user_rol.entity';
import { Ph } from '../entities/ph.entity';
import { UserRolePh } from '../entities/user_roles_phs.entity';
import { CreateUserRolePhDto } from '../dtos/payload/user_roles_phs-payload.dto';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@Injectable()
export class UserRolesPhsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(UserRol)
    private readonly userRolRepository: Repository<UserRol>,
    @InjectRepository(Ph)
    private readonly phRepository: Repository<Ph>,
    @InjectRepository(UserRolePh)
    private readonly userRolePhRepository: Repository<UserRolePh>
  ) {}

  async assignPhs(userRoleId: string, dto: CreateUserRolePhDto): Promise<any> {
    const userRole = await this.userRolRepository.findOne({
      where: { id: userRoleId, is_active: true }
    });

    if (!userRole) {
      throw new NotFoundException(
        this.i18n.t('user_roles.NOT_FOUND', { lang, args: { id: userRoleId } })
      );
    }

    const phs = await this.phRepository.find({
      where: { id: In(dto.phs_ids), is_active: true }
    });

    if (phs.length !== dto.phs_ids.length) {
      throw new NotFoundException(
        this.i18n.t('user_roles_phs.PHS_NOT_FOUND', { lang, args: {} })
      );
    }

    const existing = await this.userRolePhRepository.find({
      where: { user_roles_id: userRoleId, is_active: true, phs_id: In(dto.phs_ids) }
    });

    const existingIds = new Set(existing.map(item => item.phs_id));
    const newIds = dto.phs_ids.filter(id => !existingIds.has(id));

    if (newIds.length > 0) {
      const entities = newIds.map(phsId => this.userRolePhRepository.create({
        user_roles_id: userRoleId,
        phs_id: phsId
      }));
      await this.userRolePhRepository.save(entities);
    }

    let message: string;
    if (newIds.length === 0) {
      message = this.i18n.t('user_roles_phs.MSG_ALREADY_ASSIGNED', { lang }) || 'Las copropiedades ya estaban asignadas';
    } else if (dto.phs_ids.length - newIds.length > 0) {
      message = this.i18n.t('user_roles_phs.MSG_PARTIAL', { lang }) || 'Algunas copropiedades ya estaban asignadas';
    } else {
      message = this.i18n.t('user_roles_phs.MSG_CREATE', { lang }) || 'Copropiedades asignadas correctamente';
    }

    return {
      status: this.i18n.t('general.SUCCESS', { lang, args: {} }),
      message,
      data: {
        user_roles_id: userRoleId,
        phs_assigned: newIds.length,
        phs_already_existed: dto.phs_ids.length - newIds.length,
        total_phs: dto.phs_ids.length
      }
    };
  }

  async getPhsByUserRole(userRoleId: string): Promise<any> {
    const assignments = await this.userRolePhRepository.find({
      where: { user_roles_id: userRoleId, is_active: true },
      relations: ['ph']
    });

    if (assignments.length === 0) {
      throw new NotFoundException(
        this.i18n.t('user_roles_phs.NOT_FOUND', { lang, args: { id: userRoleId } })
      );
    }

    return {
      status: this.i18n.t('general.SUCCESS', { lang, args: {} }),
      message: this.i18n.t('user_roles_phs.MSG_GET', { lang, args: {} }),
      data: {
        user_roles_id: userRoleId,
        phs: assignments.map(item => ({
          id: item.ph.id,
          name: item.ph.name
        }))
      }
    };
  }

  // Actualizar asignación de copropiedad (cambiar la PH asociada)
  async update(id: string, dto: CreateUserRolePhDto): Promise<any> {
    const assignment = await this.userRolePhRepository.findOne({
      where: { id, is_active: true },
    });

    if (!assignment) {
      throw new NotFoundException(
        this.i18n.t('user_roles_phs.NOT_FOUND_ASSIGNMENT', { lang, args: { id } })
      );
    }

    if (dto.phs_ids?.length > 0) {
      const ph = await this.phRepository.findOne({
        where: { id: dto.phs_ids[0], is_active: true },
      });

      if (!ph) {
        throw new NotFoundException(
          this.i18n.t('user_roles_phs.PHS_NOT_FOUND', { lang, args: {} })
        );
      }

      assignment.phs_id = ph.id;
    }

    const updated = await this.userRolePhRepository.save(assignment);

    return {
      status: this.i18n.t('general.SUCCESS', { lang }),
      message: this.i18n.t('user_roles_phs.MSG_UPDATE', { lang }) || 'Asignación de copropiedad actualizada correctamente',
      data: updated,
    };
  }

  // Eliminar asignación de copropiedad (soft delete)
  async delete(id: string): Promise<any> {
    const assignment = await this.userRolePhRepository.findOne({
      where: { id, is_active: true },
    });

    if (!assignment) {
      throw new NotFoundException(
        this.i18n.t('user_roles_phs.NOT_FOUND_ASSIGNMENT', { lang, args: { id } })
      );
    }

    assignment.is_active = false;
    await this.userRolePhRepository.save(assignment);

    return {
      status: this.i18n.t('general.SUCCESS', { lang }),
      message: this.i18n.t('user_roles_phs.MSG_DELETE', { lang }) || 'Asignación de copropiedad eliminada correctamente',
    };
  }
}
