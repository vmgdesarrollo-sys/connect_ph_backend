import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { VotingQuestion } from "../entities/voting_questions.entity";
import { Agenda } from "../entities/agenda.entity";
import { CreateVotingQuestionDto } from "../dtos/payload/voting_questions-payload.dto";
import { I18nService, I18nContext } from "nestjs-i18n";
import { QaGateway } from "../gateways/qa.gateway";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
import { FindOptionsWhere } from "typeorm";
// Servicio para gestionar las preguntas de votación en una asamblea
@Injectable()
export class VotingQuestionsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(VotingQuestion)
    private readonly repository: Repository<VotingQuestion>,
    @InjectRepository(Agenda)
    private readonly agendaRepository: Repository<Agenda>,
    private readonly qaGateway: QaGateway,
  ) {}

  private normalizeStatus(input: string): 'PENDING' | 'OPEN' | 'CLOSED' {
    const normalized = (input || '').trim().toUpperCase();

    if (['PENDIENTE', 'PENDING'].includes(normalized)) return 'PENDING';
    if (['ABIERTA', 'ABIERTO', 'OPEN'].includes(normalized)) return 'OPEN';
    if (['CERRADA', 'CERRADO', 'CLOSED'].includes(normalized)) return 'CLOSED';

    throw new ForbiddenException('Invalid status. Allowed: PENDING, OPEN, CLOSED');
  }

  private ensureAdmin(user: any) {
    const roles = Array.isArray(user?.roles) ? user.roles.map((r: any) => String(r).toLowerCase()) : [];
    const isAdmin = roles.includes('administrador') || roles.includes('administrator') || roles.includes('admin');

    if (!isAdmin) {
      throw new ForbiddenException('No tienes permisos para cambiar el estado de la votación');
    }
  }

  private async applyStatusChange(id: string, user: any, targetStatus: 'PENDING' | 'OPEN' | 'CLOSED', statusMessage?: string) {
    this.ensureAdmin(user);

    const votingQuestion = await this.repository.findOne({
      where: { id, is_active: true },
      relations: ['agenda'],
    });

    if (!votingQuestion) {
      throw new NotFoundException(this.i18n.t("voting_questions.NO_ENCONTRADA"));
    }

    votingQuestion.status = targetStatus;

    if (targetStatus === 'OPEN') {
      votingQuestion.opened_at = votingQuestion.opened_at || new Date();
      votingQuestion.closed_at = null;
    }

    if (targetStatus === 'CLOSED') {
      votingQuestion.closed_at = new Date();
    }

    if (targetStatus === 'PENDING') {
      votingQuestion.opened_at = null;
      votingQuestion.closed_at = null;
    }

    const updated = await this.repository.save(votingQuestion);

    const statusColor = targetStatus === 'OPEN' ? 'green' : targetStatus === 'CLOSED' ? 'red' : 'yellow';
    const defaultMessage =
      targetStatus === 'OPEN'
        ? 'Voting is open'
        : targetStatus === 'CLOSED'
          ? 'Voting is closed'
          : 'Voting is pending';

    if (updated.agenda?.assembly_id) {
      this.qaGateway.emitVotingStatusChanged(updated.agenda.assembly_id, {
        questionId: updated.id,
        status: targetStatus,
        statusMessage: statusMessage || defaultMessage,
        color: statusColor,
        changedBy: user?.sub,
        changedAt: new Date().toISOString(),
      });
    }

    return {
      status: 'success',
      message: this.i18n.t("voting_questions.ACTUALIZADA_RES"),
      data: updated,
      realtime: {
        event: 'voting_status_changed',
        payload: {
          questionId: updated.id,
          status: targetStatus,
          statusMessage: statusMessage || defaultMessage,
          color: statusColor,
          changedBy: user?.sub,
          changedAt: new Date().toISOString(),
        },
      },
    };
  }
// Crear una nueva pregunta de votación
  async create(dto: CreateVotingQuestionDto): Promise<any> {
    const newVotingQuestion = this.repository.create(dto);
    const savedVotingQuestion = await this.repository.save(newVotingQuestion);
    
    return {
      status: "success",
      message: this.i18n.t("voting_questions.CREAR_RES"),
      data: savedVotingQuestion,
    };
  }
// Listar todas las preguntas de votación activas
  async findAll(_where?: string): Promise<VotingQuestion[]> {
  const where: FindOptionsWhere<VotingQuestion> = { is_active: true };

  if (_where) {
    const agendaMatch = _where.match(/agenda_id=([a-f0-9-]+)/i);

    if (agendaMatch) {
      where.agenda_id = agendaMatch[1];
    }
  }

  return this.repository.find({
    where,
  });
}

  // Actualizar una pregunta de votación por ID
  async update(id: string, dto: CreateVotingQuestionDto): Promise<any> {
  const votingQuestion = await this.repository.findOne({
    where: { id, is_active: true },
  });

  if (!votingQuestion) {
    throw new NotFoundException(
      this.i18n.t("voting_questions.NO_ENCONTRADA"),
    );
  }

  const filteredDto = Object.fromEntries(
    Object.entries(dto).filter(([_, value]) => value !== undefined)
  );

  Object.assign(votingQuestion, filteredDto);

  const updatedVotingQuestion = await this.repository.save(votingQuestion);

  return {
    status: "success",
    message: this.i18n.t("voting_questions.ACTUALIZADA_RES"),
    data: updatedVotingQuestion,
  };
}

// Eliminar una pregunta de votación por ID (soft delete)
  async delete(id: string): Promise<any> {
    const votingQuestion = await this.repository.findOne({ 
      where: { id, is_active: true } 
    });
    
    if (!votingQuestion) {
      throw new NotFoundException(
        this.i18n.t("voting_questions.NO_ENCONTRADA")
      );
    }

    votingQuestion.is_active = false;
    await this.repository.save(votingQuestion);
    
    return { 
      status: "success", 
      message: this.i18n.t("voting_questions.ELIMINADA_RES") 
    };
  }

  // Obtener preguntas de votación de una asamblea específica
  async findByAssemblyId(assemblyId: string): Promise<any> {
    const votingQuestions = await this.repository
      .createQueryBuilder('vq')
      .innerJoin('vq.agenda', 'agenda')
      .where('agenda.assembly_id = :assemblyId', { assemblyId })
      .andWhere('agenda.is_active = :isActive', { isActive: true })
      .andWhere('vq.is_active = :isActive', { isActive: true })
      .leftJoinAndSelect('vq.options', 'options')
      .leftJoinAndSelect('vq.votes', 'votes')
      .leftJoinAndSelect('vq.createdByUser', 'createdByUser')
      .leftJoinAndSelect('vq.updatedByUser', 'updatedByUser')
      .orderBy('agenda.sort_order', 'ASC')
      .getMany();

    return {
      status: "success",
      message: this.i18n.t("voting_questions.LISTAR_POR_ASAMBLEA_RES", { lang }),
      data: votingQuestions,
    };
  }

  async openVoting(id: string, user: any, statusMessage?: string): Promise<any> {
    return this.applyStatusChange(id, user, 'OPEN', statusMessage);
  }

  async closeVoting(id: string, user: any, statusMessage?: string): Promise<any> {
    return this.applyStatusChange(id, user, 'CLOSED', statusMessage);
  }

  async changeVotingStatus(id: string, user: any, status: string, statusMessage?: string): Promise<any> {
    const normalized = this.normalizeStatus(status);
    return this.applyStatusChange(id, user, normalized, statusMessage);
  }
}