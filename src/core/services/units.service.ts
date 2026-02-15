import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Unit } from "../entities/unit.entity";
import { Ph } from "../entities/ph.entity";
import { CreateUnitDto } from "../dtos/payload/unit-payload.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar las unidades (departamentos) dentro de una copropiedad (PH)
@Injectable()
export class UnitsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Ph)
    private readonly phRepository: Repository<Ph>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}
// Crear una nueva unidad dentro de una copropiedad (PH)
  async create(phs_id: string, createUnitDto: CreateUnitDto): Promise<any> {
    // Validar que el PH existe
    const phExists = await this.phRepository.findOne({ 
      where: { id: phs_id, is_active: true } 
    });
    
    if (!phExists) {
      throw new NotFoundException(
        this.i18n.t("phs.NOT_FOUND", { lang, args: { id: phs_id } })
      );
    }

    const newUnit = this.unitRepository.create({
      ...createUnitDto,
      phs_id: phs_id
    });
    const savedUnit = await this.unitRepository.save(newUnit);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.REGISTER_CREATED", { lang, args: {} }),
      data: savedUnit,
    };
  }
// Actualizar una unidad dentro de una copropiedad (PH)
  async update(
    phs_id: string,
    id: string,
    createUnitDto: CreateUnitDto,
  ): Promise<any> {
    const unit = await this.unitRepository.findOne({ 
      where: { id, phs_id, is_active: true } 
    });
    
    if (!unit) {
      throw new NotFoundException(
        this.i18n.t("units.NOT_FOUND", { lang, args: { id } })
      );
    }

    Object.assign(unit, createUnitDto);
    const updatedUnit = await this.unitRepository.save(unit);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.REGISTER_UPDATED", { lang, args: {} }),
      data: updatedUnit,
    };
  }
// Listar todas las unidades dentro de una copropiedad (PH)
  async findAll(
    phs_id: string,
    _fields?: string,
    _where?: string,
  ): Promise<any> {
    const units = await this.unitRepository.find({
      where: { phs_id, is_active: true },
    });
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.MSG_LIST", { lang, args: {} }),
      data: units,
      properties: {
        total_items: units.length,
        items_per_page: units.length,
        current_page: 1,
        total_pages: 1,
      },
    };
  }
// Obtener detalle de una unidad dentro de una copropiedad (PH)
  async findOne(phs_id: string, id: string): Promise<any> {
    const unit = await this.unitRepository.findOne({
      where: { id, phs_id, is_active: true },
    });
    
    if (!unit) {
      throw new NotFoundException(
        this.i18n.t("units.NOT_FOUND", { lang, args: { id } })
      );
    }
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.REGISTER_DETAILS", { lang, args: {} }),
      data: unit,
    };
  }

  // Eliminar una unidad dentro de una copropiedad (PH)
  async delete(phs_id: string, id: string): Promise<any> {
    const unit = await this.unitRepository.findOne({
      where: { id, phs_id, is_active: true },
    });
    
    if (!unit) {
      throw new NotFoundException(
        this.i18n.t("units.NOT_FOUND", { lang, args: { id } })
      );
    }

    unit.is_active = false;
    await this.unitRepository.save(unit);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.MSG_DELETE", { lang, args: { id, phs_id } }),
    };
  }
}
