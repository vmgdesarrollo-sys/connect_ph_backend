import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { VotingQuestion } from "../entities/voting_questions.entity";
import { CreateVotingQuestionDto } from "../dtos/payload/voting_questions-payload.dto";
import { I18nService } from "nestjs-i18n";
// Servicio para gestionar las preguntas de votación en una asamblea
@Injectable()
export class VotingQuestionsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(VotingQuestion)
    private readonly repository: Repository<VotingQuestion>,
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
}