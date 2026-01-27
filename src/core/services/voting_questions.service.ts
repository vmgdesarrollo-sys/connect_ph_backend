import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { VotingQuestion } from "../entities/voting_questions.entity";
import { CreateVotingQuestionDto } from "../dtos/payload/voting_questions-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nService } from "nestjs-i18n";

@Injectable()
export class VotingQuestionsService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(VotingQuestion))
    private readonly repository: Repository<VotingQuestion>,
  ) {}

  async create(dto: CreateVotingQuestionDto): Promise<any> {
    return {
      status: "success",
      message: this.i18n.t("voting_questions.CREAR_RES"),
      data: { id: "uuid-vote-q-123", ...dto, created_at: new Date() },
    };
  }

  async findAll(_where?: string): Promise<any[]> {
    return [
      {
        id: "uuid-vote-q-123",
        question_text: "¿Aprueba el presupuesto 2026?",
        status: "Abierta",
        result_type: "Única",
        opened_at: new Date(),
        closed_at: null,
      }
    ];
  }

  async update(id: string, dto: CreateVotingQuestionDto): Promise<any> {
    return {
      status: "success",
      message: this.i18n.t("voting_questions.ACTUALIZADA_RES"),
      data: { id, ...dto },
    };
  }

  async delete(id: string): Promise<any> {
    return { 
      status: "success", 
      message: this.i18n.t("voting_questions.ELIMINADA_RES") 
    };
  }
}