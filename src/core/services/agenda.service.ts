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
    const existingOrder = await this.agendaRepository.findOne({
      where: { 
        assembly_id: createAgendaDto.assembly_id, 
        sort_order: createAgendaDto.sort_order 
      },
    });

    if (existingOrder) {
      throw new ConflictException(this.i18n.t('agenda.ERROR_ORDEN', { lang, args: { order: createAgendaDto.sort_order } }));
    }

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
    const agenda = await this.agendaRepository.findOne({ where: { id, is_active: true } });
    
    if (!agenda) {
      throw new NotFoundException(
        this.i18n.t("agenda.AGENDA_NO_EXISTE", { lang, args: { id } }),
      );
    }

    // Si está cambiando el sort_order, verificar que no exista en otro punto de la misma asamblea
    if (updateDto.sort_order && updateDto.sort_order !== agenda.sort_order) {
      const existingOrder = await this.agendaRepository.findOne({
        where: {
          assembly_id: updateDto.assembly_id,
          sort_order: updateDto.sort_order,
        },
      });

      if (existingOrder && existingOrder.id !== id) {
        throw new ConflictException(
          this.i18n.t("agenda.ERROR_ORDEN", { lang, args: { order: updateDto.sort_order } }),
        );
      }
    }
// Actualizar campos
    Object.assign(agenda, updateDto);
    const updatedAgenda = await this.agendaRepository.save(agenda);

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_ACTUALIZADA", { lang }),
      data: updatedAgenda,
    };
  }
// Listar todos los puntos de agenda activos
  async findAll(_fields?: string, _where?: string): Promise<any[]> {
    const agendas = await this.agendaRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
    return agendas;
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
}
