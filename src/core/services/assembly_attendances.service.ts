import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { CreateAttendanceDto } from "../dtos/payload/assembly_attendances-payload.dto";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar las asistencias a asambleas
@Injectable()
export class AssemblyAttendancesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(AssemblyAttendance)
    private readonly attendanceRepository: Repository<AssemblyAttendance>,
  ) {}
// Crear una nueva asistencia de asamblea
  async create(dto: CreateAttendanceDto): Promise<any> {
    const newAttendance = this.attendanceRepository.create(dto);
    const savedAttendance = await this.attendanceRepository.save(newAttendance);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.CREAR_RES", { lang }),
      data: savedAttendance,
    };
  }
// Actualizar una asistencia de asamblea por ID
  async update(id: string, dto: CreateAttendanceDto): Promise<any> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    
    if (!attendance) {
      throw new NotFoundException(
        this.i18n.t("assembly_attendances.NO_EXISTE", { lang, args: { id } }),
      );
    }

    Object.assign(attendance, dto);
    const updatedAttendance = await this.attendanceRepository.save(attendance);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.ACTUALIZADA_RES", { lang }),
      data: updatedAttendance,
    };
  }
// Listar todas las asistencias de asambleas
  async findAll(_where?: string): Promise<any[]> {
    const attendances = await this.attendanceRepository.find({
      order: { arrival_at: 'ASC' },
    });
    return attendances;
  }
// Obtener detalle de una asistencia de asamblea por ID
  async findOne(id: string): Promise<any> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });

    if (!attendance) {
      throw new NotFoundException(
        this.i18n.t("assembly_attendances.NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.DETALLE_RES", { lang }),
      data: attendance,
    };
  }
// Eliminar una asistencia de asamblea por ID
  async delete(id: string): Promise<any> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    
    if (!attendance) {
      throw new NotFoundException(
        this.i18n.t("assembly_attendances.NO_EXISTE", { lang, args: { id } }),
      );
    }

    await this.attendanceRepository.remove(attendance);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_attendances.ELIMINADA_RES", { lang, args: { id } }),
    };
  }
}