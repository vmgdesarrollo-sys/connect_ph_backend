import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Agenda } from "../entities/agenda.entity";
import { CreateAgendaDto } from "../dtos/payload/agenda-payload.dto";
import { I18nContext, I18nService } from "nestjs-i18n";
import { FindOptionsWhere } from 'typeorm';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar los puntos de agenda de una asamblea
@Injectable()
export class AgendaService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Agenda)
    private readonly agendaRepository: Repository<Agenda>,
  ) {}
// Crear un nuevo punto de agenda
  async create(createAgendaDto: CreateAgendaDto): Promise<any> {

    const newAgenda = this.agendaRepository.create(createAgendaDto);
    const savedAgenda = await this.agendaRepository.save(newAgenda);

  // Retornar la respuesta
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_CREADA", { lang }),
      data: savedAgenda,
    };
  }
// Actualizar un punto de agenda por ID
async update(id: string, updateDto: CreateAgendaDto): Promise<any> {

  const agenda = await this.agendaRepository.findOne({
    where: { id, is_active: true }
  });

  if (!agenda) {
    throw new NotFoundException(
      this.i18n.t("agenda.AGENDA_NO_EXISTE", { lang, args: { id } }),
    );
  }


  Object.assign(agenda, updateDto);

  const updatedAgenda = await this.agendaRepository.save(agenda);

  return {
    status: this.i18n.t("general.SUCCESS", { lang }),
    message: this.i18n.t("agenda.AGENDA_ACTUALIZADA", { lang }),
    data: updatedAgenda,
  };
}
// Listar puntos de agenda activos, con opción de filtrar por assembly_id
  async findAll(_fields?: string, _where?: string): Promise<Agenda[]> {
  const where: FindOptionsWhere<Agenda> = { is_active: true };

  if (_where) {
    const assemblyMatch = _where.match(/assembly_id=([a-f0-9-]+)/i);

    if (assemblyMatch) {
      where.assembly_id = assemblyMatch[1];
    }
  }

  return this.agendaRepository.find({
    where,
    order: { sort_order: 'ASC' },
  });
}
// Obtener detalle de un punto de agenda por ID
  async findOne(id: string): Promise<any> {
    const agenda = await this.agendaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!agenda) {
      throw new NotFoundException(
        this.i18n.t("agenda.AGENDA_NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.DETALLE_AGENDA", { lang }),
      data: agenda,
    };
  }
// Eliminar un punto de agenda por ID (soft delete)
  async delete(id: string): Promise<any> {
    const agenda = await this.agendaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!agenda) {
      throw new NotFoundException(
        this.i18n.t("agenda.AGENDA_NO_EXISTE", { lang, args: { id } }),
      );
    }

    agenda.is_active = false;
    await this.agendaRepository.save(agenda);

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_ELIMINADA", { lang, args: { id } }),
    };
  }

  // Obtener todos los puntos de agenda de una asamblea
  async findByAssemblyId(assemblyId: string): Promise<any> {
    const agendas = await this.agendaRepository.find({
      where: { 
        assembly_id: assemblyId, 
        is_active: true 
      },
      order: { sort_order: 'ASC' },
      relations: ['createdByUser', 'updatedByUser'],
    });

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_POR_ASAMBLEA", { lang }),
      data: agendas,
    };
  }
}
