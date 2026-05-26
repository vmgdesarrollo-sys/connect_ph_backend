import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QaEntry } from "../entities/qa_entries.entity";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { CreateQaEntryDto, UpdateQaEntryDto } from "../dtos/payload/qa_entries-payload.dto";
import { I18nService } from "nestjs-i18n";
import { QaGateway } from "../gateways/qa.gateway";

const EXCLUDED_ACTIVE_STATUSES = ['rechazada', 'rejected', 'removed', 'eliminada'];

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

  private buildAuthor(firstName?: string | null, lastName?: string | null): string {
    const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    return name || 'Usuario';
  }

  private mapQuestionRow(row: any) {
    return {
      id: row.id,
      text: row.text,
      author: this.buildAuthor(row.first_name, row.last_name),
      authorId: row.author_id,
      time: row.time,
    };
  }
// Crear una nueva entrada de pregunta y respuesta
  async create(dto: CreateQaEntryDto): Promise<any> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: dto.assembly_attendances_id },
      relations: ['unitAssignment', 'unitAssignment.user'],
    });

    if (!attendance) {
      throw new NotFoundException(
        this.i18n.t("qa_entries.ATTENDANCE_NOT_FOUND") || "Asistencia no encontrada"
      );
    }

    const qaEntry = this.qaRepository.create(dto);
    const saved = await this.qaRepository.save(qaEntry);

    const data = {
      id: saved.id,
      text: saved.question_text,
      author: this.buildAuthor(
        attendance.unitAssignment?.user?.first_name,
        attendance.unitAssignment?.user?.last_name,
      ),
      authorId: attendance.unitAssignment?.user?.id,
      time: saved.created_at,
    };

    // Emit socket event for real-time update
    if (attendance.assemblies_id) {
      this.qaGateway.emitNewQuestion(attendance.assemblies_id, data);
    }

    return {
      status: "success",
      message: this.i18n.t("qa_entries.CREAR_RES"),
      data,
    };
  }
// Listar todas las entradas de preguntas y respuestas, opcionalmente por ID de asistencia
  async findAll(attendanceId?: string): Promise<any[]> {
    const qb = this.qaRepository
      .createQueryBuilder('qa')
      .innerJoin('qa.assemblyAttendance', 'aa')
      .innerJoin('aa.unitAssignment', 'ua')
      .innerJoin('ua.user', 'u')
      .select([
        'qa.id AS id',
        'qa.question_text AS text',
        'qa.created_at AS time',
        'u.id AS author_id',
        'u.first_name AS first_name',
        'u.last_name AS last_name',
      ])
      .orderBy('qa.created_at', 'DESC');

    if (attendanceId) {
      qb.andWhere('qa.assembly_attendances_id = :attendanceId', { attendanceId });
    }

    const rows = await qb.getRawMany();
    return rows.map((row) => this.mapQuestionRow(row));
  }

  // Obtener preguntas por ID de asamblea
  async findByAssembly(assemblyId: string): Promise<any[]> {
    const rows = await this.qaRepository
      .createQueryBuilder('qa')
      .innerJoin('qa.assemblyAttendance', 'aa')
      .innerJoin('aa.unitAssignment', 'ua')
      .innerJoin('ua.user', 'u')
      .where('aa.assemblies_id = :assemblyId', { assemblyId })
      .andWhere('qa.is_active = :isActive', { isActive: true })
      .select([
        'qa.id AS id',
        'qa.question_text AS text',
        'qa.created_at AS time',
        'u.id AS author_id',
        'u.first_name AS first_name',
        'u.last_name AS last_name',
      ])
      .orderBy('qa.created_at', 'DESC')
      .getRawMany();

    return rows.map((row) => this.mapQuestionRow(row));
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
    const rows = await this.qaRepository
      .createQueryBuilder('qa')
      .innerJoin('qa.assemblyAttendance', 'aa')
      .innerJoin('aa.unitAssignment', 'ua')
      .innerJoin('ua.user', 'u')
      .where('aa.assemblies_id = :assemblyId', { assemblyId })
      .andWhere('qa.is_active = :isActive', { isActive: true })
      .andWhere("COALESCE(LOWER(qa.status), '') NOT IN (:...excludedStatuses)", {
        excludedStatuses: EXCLUDED_ACTIVE_STATUSES,
      })
      .select([
        'qa.id AS id',
        'qa.question_text AS text',
        'qa.created_at AS time',
        'u.id AS author_id',
        'u.first_name AS first_name',
        'u.last_name AS last_name',
      ])
      .orderBy('qa.created_at', 'DESC')
      .getRawMany();

    return rows.map((row) => this.mapQuestionRow(row));
  }

  // Obtener preguntas moderadas de una asamblea
  async getModeratedQuestions(assemblyId: string): Promise<any[]> {
    const rows = await this.qaRepository
      .createQueryBuilder('qa')
      .innerJoin('qa.assemblyAttendance', 'aa')
      .innerJoin('aa.unitAssignment', 'ua')
      .innerJoin('ua.user', 'u')
      .where('aa.assemblies_id = :assemblyId', { assemblyId })
      .andWhere('qa.is_moderated = :isModerated', { isModerated: true })
      .select([
        'qa.id AS id',
        'qa.question_text AS text',
        'qa.created_at AS time',
        'u.id AS author_id',
        'u.first_name AS first_name',
        'u.last_name AS last_name',
      ])
      .orderBy('qa.created_at', 'DESC')
      .getRawMany();

    return rows.map((row) => this.mapQuestionRow(row));
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

    const finalStatus = (dto.status ?? qaEntry.status ?? '').toString().toLowerCase();
    if (EXCLUDED_ACTIVE_STATUSES.includes(finalStatus)) {
      dto['is_active'] = false;
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
      final_status: updated?.status,
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

    qaEntry.is_active = false;
    qaEntry.status = 'removed';
    const updated = await this.qaRepository.save(qaEntry);

    if (qaEntry.assembly_attendances_id) {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: qaEntry.assembly_attendances_id },
      });

      if (attendance?.assemblies_id) {
        this.qaGateway.emitQuestionModerated(attendance.assemblies_id, {
          questionId: qaEntry.id,
          status: 'removed',
          is_moderated: true,
          moderated_at: new Date(),
        });
      }
    }

    return { 
      status: "success", 
      message: this.i18n.t("qa_entries.ELIMINADA_RES"),
      final_status: updated.status,
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }
}