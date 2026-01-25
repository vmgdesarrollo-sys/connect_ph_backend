import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { Assembly } from "../entities/assemblies.entity";
import { CreateAssemblyDto } from "../dtos/payload/assemblies-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AssembliesService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(Assembly))
    private readonly assemblyRepository: Repository<Assembly>,
  ) {}

  async create(createAssemblyDto: CreateAssemblyDto): Promise<any> {
    // MOCK para agilizar desarrollo
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.CREAR_RES", { lang }),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...createAssemblyDto,
        status: createAssemblyDto.status || "Programada",
        created_at: new Date().toISOString(),
      },
    };

    /* Lógica Real:
    const newAssembly = this.assemblyRepository.create(createAssemblyDto);
    return await this.assemblyRepository.save(newAssembly);
    */
  }

  async update(id: string, updateDto: CreateAssemblyDto): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.ACTUALIZADA_RES", { lang }),
      data: { 
        id, 
        ...updateDto,
        updated_at: new Date().toISOString()
      },
    };
  }

  async findAll(_fields?: string, _where?: string): Promise<any[]> {
    // Mock de listado con todas las propiedades solicitadas
    return [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        phs_id: "uuid-ph-123",
        name: "Asamblea General Ordinaria 2026",
        description: "Reunión anual de copropietarios",
        type: "Ordinaria",
        status: "Programada",
        scheduled_at: "2026-03-15T08:00:00Z",
        started_at: null,
        finished_at: null,
        livekit_room_name: "sala-alamo-2026",
        quorum_requirement: 51.0,
        is_active: true,
        created_at: new Date("2026-01-25T13:45:00Z"),
      },
    ];
  }

  async findOne(id: string): Promise<any> {
    const assembly = {
      id,
      phs_id: "uuid-ph-123",
      name: "Asamblea General Ordinaria 2026",
      description: "Reunión anual de copropietarios",
      type: "Ordinaria",
      status: "En curso",
      scheduled_at: "2026-03-15T08:00:00Z",
      started_at: "2026-03-15T08:05:00Z",
      finished_at: null,
      livekit_room_name: "sala-alamo-2026",
      quorum_requirement: 51.0,
      is_active: true,
    };

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.DETALLE_RES", { lang }),
      data: assembly,
    };
  }

  async delete(id: string): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.ELIMINADA_RES", { lang, args: { id } }),
    };
  }
}