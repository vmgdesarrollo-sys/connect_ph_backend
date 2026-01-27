import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { CreateAttendanceDto } from "../dtos/payload/assembly_attendances-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AssemblyAttendancesService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(AssemblyAttendance))
    private readonly attendanceRepository: Repository<AssemblyAttendance>,
  ) {}

  async create(dto: CreateAttendanceDto): Promise<any> {
    // MOCK para desarrollo
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.CREAR_RES", { lang }),
      data: {
        id: "770e8400-e29b-41d4-a716-446655440000",
        ...dto,
        arrival_at: dto.arrival_at || new Date().toISOString(),
        is_present: true,
      },
    };
  }

  async update(id: string, dto: CreateAttendanceDto): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.ACTUALIZADA_RES", { lang }),
      data: { 
        id, 
        ...dto,
        updated_at: new Date().toISOString()
      },
    };
  }

  async findAll(_where?: string): Promise<any[]> {
    return [
      {
        id: "770e8400-e29b-41d4-a716-446655440000",
        assemblies_id: "uuid-asamblea-123",
        unit_assignments_id: "uuid-asignacion-456",
        arrival_at: "2026-03-15T07:45:00Z",
        departure_at: null,
        is_present: true,
        proxy_file_id: null,
        notes: "Ingreso puntual",
      }
    ];
  }

  async findOne(id: string): Promise<any> {
    const attendance = {
      id,
      assemblies_id: "uuid-asamblea-123",
      unit_assignments_id: "uuid-asignacion-456",
      arrival_at: "2026-03-15T07:45:00Z",
      is_present: true,
      notes: "Ingreso puntual",
    };

    if (!attendance) {
      throw new NotFoundException(
        this.i18n.t("attendances.ERRORS.NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.DETALLE_RES", { lang }),
      data: attendance,
    };
  }

  async delete(id: string): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.ELIMINADA_RES", { lang, args: { id } }),
    };
  }
}