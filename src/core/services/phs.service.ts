import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Ph } from "../entities/ph.entity";
import { CreatePhDto } from "../dtos/payload/ph-payload.dto";

import { I18nContext, I18nService } from 'nestjs-i18n';
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@Injectable()
export class PhsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Ph)
    private readonly phRepository: Repository<Ph>
  ) {}
// Crear una nueva copropiedad (PH)
  async create(createPhDto: CreatePhDto): Promise<any> {
    // Verificar si el NIT (tax_id) ya existe
    const existingPh = await this.phRepository.findOne({
      where: { tax_id: createPhDto.tax_id },
    });

    if (existingPh) {
      throw new ConflictException(this.i18n.t('phs.ERROR_TAX', {lang, args: {},}));
    }

    const newPh = this.phRepository.create(createPhDto);
    const savedPh = await this.phRepository.save(newPh);

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('phs.COPROPIEDAD_CREADA', {lang, args: {},}),
      data: savedPh,
    };
  }
  // Actualizar una copropiedad (PH) por ID
  async update(id: string, createPhDto: CreatePhDto): Promise<any> {
    const ph = await this.phRepository.findOne({ where: { id } });
    
    if (!ph) {
      throw new NotFoundException(this.i18n.t('phs.COPROPIEDAD_NO_EXISTE', {lang, args: {id},}));
    }

    // Si está cambiando el tax_id, verificar que no exista en otra PH
    if (createPhDto.tax_id && createPhDto.tax_id !== ph.tax_id) {
      const existingPh = await this.phRepository.findOne({
        where: { tax_id: createPhDto.tax_id },
      });
      
      if (existingPh) {
        throw new ConflictException(this.i18n.t('phs.ERROR_TAX', {lang, args: {},}));
      }
    }

    // Actualizar campos
    Object.assign(ph, createPhDto);
    
    const updatedPh = await this.phRepository.save(ph);

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('phs.COPROPIEDAD_ACTUALIZADA', {lang, args: {},}),
      data: updatedPh,
    };
  }
// Listar todas las copropiedades (PH) activas
  async findAll(_fields?: string, _where?: string): Promise<any> {
    const phs = await this.phRepository.find({
      where: { is_active: true },
    });

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('phs.MSG_LIST', {lang, args: {},}),
      data: phs,
      properties: {
        total_items: phs.length,
        items_per_page: 10,
        current_page: 1,
        total_pages: Math.ceil(phs.length / 10),
      },
    };
  }
// Obtener detalle de una copropiedad (PH) por ID
  async findOne(id: string): Promise<any> {
    const ph = await this.phRepository.findOne({
      where: { id, is_active: true },
    });

    if (!ph) {
      throw new NotFoundException(this.i18n.t('phs.COPROPIEDAD_NO_EXISTE', {lang, args: {id},}));
    }

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('phs.DETALLE_COPROPIEDAD', {lang, args: {},}),
      data: ph,
    };
  }

  async delete(id: string): Promise<any> {
    const ph = await this.phRepository.findOne({
      where: { id, is_active: true },
    });

    if (!ph) {
      throw new NotFoundException(this.i18n.t('phs.COPROPIEDAD_NO_EXISTE', {lang, args: {id},}));
    }

    // Soft delete: cambiar is_active a false
    ph.is_active = false;
    await this.phRepository.save(ph);

    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('phs.COPROPIEDAD_ELIMINADA', {lang, args: {id},}),
    };
  }
}
