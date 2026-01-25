import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { Agenda } from "../entities/agenda.entity";
import { CreateAgendaDto } from "../dtos/payload/agenda-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AgendaService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(Agenda))
    private readonly agendaRepository: Repository<Agenda>,
  ) {}

  async create(createAgendaDto: CreateAgendaDto): Promise<any> {
    // MOCK para agilizar desarrollo
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_CREADA", { lang }),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...createAgendaDto,
        created_at: new Date().toISOString(),
      },
    };

    /* Lógica Real:
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
    return await this.agendaRepository.save(newAgenda);
    */
  }

  async update(id: string, updateDto: CreateAgendaDto): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_ACTUALIZADA", { lang }),
      data: { id, ...updateDto },
    };
  }

  async findAll(_fields?: string, _where?: string): Promise<any[]> {
    return [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Lectura de Acta",
        sort_order: 1,
        is_active: true,
      },
    ] as Agenda[];
  }

  async findOne(id: string): Promise<any> {
    // Simulación de búsqueda
    const agenda = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      assembly_id: "uuid-asamblea-123",
      title: "Lectura del acta anterior",
      sort_order: 1,
      is_votable: true,
      required_quorum: 51,
      is_active: true,
      created_at: "2026-01-25 13:00:00",
    };
    if (!agenda)
      throw new NotFoundException(
        this.i18n.t("agenda.AGENDA_NO_EXISTE", { lang, args: { id } }),
      );

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.DETALLE_AGENDA", { lang }),
      data: agenda,
    };
  }

  async delete(id: string): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("agenda.AGENDA_ELIMINADA", { lang, args: { id } }),
    };
  }
}
