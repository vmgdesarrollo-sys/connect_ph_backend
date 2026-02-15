import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QaEntry } from "../entities/qa_entries.entity";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { CreateQaEntryDto, UpdateQaEntryDto } from "../dtos/payload/qa_entries-payload.dto";
import { I18nService } from "nestjs-i18n";
// Servicio para gestionar las preguntas y respuestas de asambleas
@Injectable()
export class QaEntriesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(QaEntry)
    private readonly qaRepository: Repository<QaEntry>,
    @InjectRepository(AssemblyAttendance)
    private readonly attendanceRepository: Repository<AssemblyAttendance>,
  ) {}
// Crear una nueva entrada de pregunta y respuesta
  async create(dto: CreateQaEntryDto): Promise<any> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: dto.assembly_attendances_id },
    });

    if (!attendance) {
      throw new NotFoundException(
        this.i18n.t("qa_entries.ATTENDANCE_NOT_FOUND") || "Asistencia no encontrada"
      );
    }

    const qaEntry = this.qaRepository.create(dto);
    const saved = await this.qaRepository.save(qaEntry);

    return {
      status: "success",
      message: this.i18n.t("qa_entries.CREAR_RES"),
      data: saved,
    };
  }
// Listar todas las entradas de preguntas y respuestas, opcionalmente por ID de asistencia
  async findAll(attendanceId?: string): Promise<any[]> {
    const where: any = {};
    
    if (attendanceId) {
      where.assembly_attendances_id = attendanceId;
    }

    return await this.qaRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }
// Actualizar una entrada de pregunta y respuesta por ID
  async update(id: string, dto: UpdateQaEntryDto): Promise<any> {
    const qaEntry = await this.qaRepository.findOne({ where: { id } });

    if (!qaEntry) {
      throw new NotFoundException(
        this.i18n.t("qa_entries.NOT_FOUND") || "Pregunta no encontrada"
      );
    }

    if (dto.answer_text && !qaEntry.answered_at) {
      dto['answered_at'] = new Date();
    }

    await this.qaRepository.update(id, dto);
    const updated = await this.qaRepository.findOne({ where: { id } });

    return {
      status: "success",
      message: this.i18n.t("qa_entries.ACTUALIZADA_RES"),
      data: updated,
    };
  }
// Eliminar una entrada de pregunta y respuesta por ID
  async delete(id: string): Promise<any> {
    const qaEntry = await this.qaRepository.findOne({ where: { id } });

    if (!qaEntry) {
      throw new NotFoundException(
        this.i18n.t("qa_entries.NOT_FOUND") || "Pregunta no encontrada"
      );
    }

    await this.qaRepository.remove(qaEntry);

    return { 
      status: "success", 
      message: this.i18n.t("qa_entries.ELIMINADA_RES") 
    };
  }
}