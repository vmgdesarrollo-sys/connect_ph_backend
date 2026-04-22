import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { QaEntry } from "../entities/qa_entries.entity";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { CreateQaEntryDto, UpdateQaEntryDto } from "../dtos/payload/qa_entries-payload.dto";
import { I18nService } from "nestjs-i18n";
import { QaGateway } from "../gateways/qa.gateway";

// Servicio para gestionar las preguntas y respuestas de asambleas
@Injectable()
export class QaEntriesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(QaEntry)
    private readonly qaRepository: Repository<QaEntry>,
    @InjectRepository(AssemblyAttendance)
    private readonly attendanceRepository: Repository<AssemblyAttendance>,
    @Inject(forwardRef(() => QaGateway))
    private readonly qaGateway: QaGateway,
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

    // Emit socket event for real-time update
    if (attendance.assemblies_id) {
      this.qaGateway.emitNewQuestion(attendance.assemblies_id, saved);
    }

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

  // Obtener preguntas por ID de asamblea
  async findByAssembly(assemblyId: string): Promise<any[]> {
    const attendances = await this.attendanceRepository.find({
      where: { assemblies_id: assemblyId },
      select: ['id'],
    });

    if (attendances.length === 0) {
      return [];
    }

    const attendanceIds = attendances.map((a) => a.id);

    return await this.qaRepository.find({
      where: { assembly_attendances_id: In(attendanceIds) },
      order: { created_at: 'DESC' },
    });
  }

  // Votar por una pregunta
  async upvote(id: string): Promise<any> {
    const qaEntry = await this.qaRepository.findOne({ where: { id } });

    if (!qaEntry) {
      throw new NotFoundException(
        this.i18n.t("qa_entries.NOT_FOUND") || "Pregunta no encontrada"
      );
    }

    await this.qaRepository.increment({ id }, 'upvotes', 1);
    const updated = await this.qaRepository.findOne({ where: { id } });

    // Emit socket event for upvote
    if (qaEntry.assembly_attendances_id) {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: qaEntry.assembly_attendances_id },
      });

      if (attendance?.assemblies_id) {
        this.qaGateway.emitQuestionUpvoted(attendance.assemblies_id, {
          questionId: id,
          upvotes: updated?.upvotes,
        });
      }
    }

    return {
      status: "success",
      message: this.i18n.t("qa_entries.UPVOTE_RES") || "Voto registrado",
      data: updated,
    };
  }

  // Obtener preguntas activas de una asamblea (para el chat en vivo)
  async getActiveQuestions(assemblyId: string): Promise<any[]> {
    const attendances = await this.attendanceRepository.find({
      where: { assemblies_id: assemblyId },
      select: ['id'],
    });

    if (attendances.length === 0) {
      return [];
    }

    const attendanceIds = attendances.map((a) => a.id);

    return await this.qaRepository.find({
      where: { 
        assembly_attendances_id: In(attendanceIds),
        is_active: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  // Obtener preguntas moderadas de una asamblea
  async getModeratedQuestions(assemblyId: string): Promise<any[]> {
    const attendances = await this.attendanceRepository.find({
      where: { assemblies_id: assemblyId },
      select: ['id'],
    });

    if (attendances.length === 0) {
      return [];
    }

    const attendanceIds = attendances.map((a) => a.id);

    return await this.qaRepository.find({
      where: { 
        assembly_attendances_id: In(attendanceIds),
        is_moderated: true,
      },
      order: { upvotes: 'DESC', created_at: 'DESC' },
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

    // Emit socket events for real-time updates
    if (qaEntry.assembly_attendances_id && updated) {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: qaEntry.assembly_attendances_id },
      });

      if (attendance?.assemblies_id) {
        // Emit question answered event if answer was provided
        if (dto.answer_text) {
          this.qaGateway.emitQuestionAnswered(attendance.assemblies_id, {
            questionId: id,
            answerText: dto.answer_text,
            answered_at: updated.answered_at,
            status: 'Respondida',
          });
        }

        // Emit question moderated event
        if (dto.is_moderated !== undefined || dto.status) {
          this.qaGateway.emitQuestionModerated(attendance.assemblies_id, {
            questionId: id,
            status: dto.status || qaEntry.status,
            is_moderated: dto.is_moderated ?? qaEntry.is_moderated,
            answerText: dto.answer_text,
            answered_at: updated.answered_at,
            moderated_at: new Date(),
          });
        }
      }
    }

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