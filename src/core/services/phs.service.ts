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

  // Listar todas las copropiedades (PHs) con filtrado por usuario y de campos
  async findAll(_fields?: string, _where?: string, userId?: string): Promise<any> {
  const qb = this.phRepository.createQueryBuilder('p').where('p.is_active = true');

  if (userId) {
    qb.innerJoin('user_roles_phs', 'urp', 'urp.phs_id = p.id AND urp.is_active = true')
      .innerJoin('user_roles', 'ur', 'ur.id = urp.user_roles_id AND ur.users_id = :userId AND ur.is_active = true', { userId });
  }

  // 1. Filtrado de campos en una sola línea
  const allowed = new Set([
  'id', 'name', 'tax_id', 'address', 'phone_number', 'email', 'logo_url', 'legal_representative', 'city', 'state', 'country',
  'stratum', 'number_of_towers', 'amount_of_real_estate', 'horizontal_property_regulations', 'is_active', 'created_by', 'updated_by', 'created_at', 'updated_at',
]);
  const fields = _fields?.split(',').map(f => f.trim()).filter(f => allowed.has(f)) || [];

  // 2. Selección dinámica optimizada
  if (fields.length > 0) {
    qb.select([...new Set(['id', ...fields])].map(f => `p.${f}`));
  }

  const [data, total_items] = await qb.distinct(true).getManyAndCount();

  return {
    status: this.i18n.t('general.SUCCESS', { lang, args: {} }),
    message: this.i18n.t('phs.MSG_LIST', { lang, args: {} }),
    data,
    pagination: { 
      total_items, 
      items_per_page: data.length, 
      current_page: 1, 
      total_pages: 1 
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
