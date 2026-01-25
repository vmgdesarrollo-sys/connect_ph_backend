import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { AssemblyAnnouncement } from "../entities/assembly_announcements.entity";
import { CreateAnnouncementDto } from "../dtos/payload/assembly_announcements-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AssemblyAnnouncementsService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(AssemblyAnnouncement))
    private readonly announcementRepository: Repository<AssemblyAnnouncement>,
  ) {}

  async create(dto: CreateAnnouncementDto): Promise<any> {
    // MOCK para desarrollo rápido
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.CREAR_RES", { lang }),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...dto,
        created_at: new Date().toISOString(),
      },
    };

    /* Lógica Real:
    const newAnnouncement = this.announcementRepository.create(dto);
    return await this.announcementRepository.save(newAnnouncement);
    */
  }

  async findAll(_where?: string): Promise<any[]> {
    // Simulación de listado filtrado por asamblea
    return [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        assemblies_id: "uuid-asamblea-123",
        title: "Inicio de Registro",
        message: "El registro de participantes ha comenzado.",
        type: "Informativo",
        is_sticky: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "661f9511-f30c-52e5-b827-557766551111",
        assemblies_id: "uuid-asamblea-123",
        title: "Urgente: Fallo de conexión",
        message: "Estamos experimentando problemas técnicos con el audio.",
        type: "Urgente",
        is_sticky: false,
        created_at: new Date().toISOString(),
      }
    ];
  }

  async update(id: string, dto: CreateAnnouncementDto): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.ACTUALIZADA_RES", { lang }),
      data: { id, ...dto },
    };
  }

  async findOne(id: string): Promise<any> {
    const announcement = {
      id,
      assemblies_id: "uuid-asamblea-123",
      title: "Anuncio de prueba",
      message: "Contenido del mensaje de prueba",
      type: "Informativo",
      is_sticky: false,
    };

    if (!announcement) {
      throw new NotFoundException(
        this.i18n.t("assembly_announcements.NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.DETALLE_RES", { lang }),
      data: announcement,
    };
  }

  async delete(id: string): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.ELIMINADA_RES", { lang, args: { id } }),
    };
  }
}