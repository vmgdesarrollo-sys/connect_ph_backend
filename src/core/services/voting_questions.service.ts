import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { VotingQuestion } from "../entities/voting_questions.entity";
import { Agenda } from "../entities/agenda.entity";
import { CreateVotingQuestionDto } from "../dtos/payload/voting_questions-payload.dto";
import { I18nService, I18nContext } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar las preguntas de votación en una asamblea
@Injectable()
export class VotingQuestionsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(VotingQuestion)
    private readonly repository: Repository<VotingQuestion>,
    @InjectRepository(Agenda)
    private readonly agendaRepository: Repository<Agenda>,
  ) {}
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
  async findAll(_where?: string): Promise<any[]> {
    const votingQuestions = await this.repository.find({ 
      where: { is_active: false } 
    });
    return votingQuestions;
  }

  // Actualizar una pregunta de votación por ID
  async update(id: string, dto: CreateVotingQuestionDto): Promise<any> {
    const votingQuestion = await this.repository.findOne({ 
      where: { id, is_active: true } 
    });
    
    if (!votingQuestion) {
      throw new NotFoundException(
        this.i18n.t("voting_questions.NO_ENCONTRADA")
      );
    }

    Object.assign(votingQuestion, dto);
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
}