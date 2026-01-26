import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { QuestionOption } from "../entities/questions_options.entity";
import { CreateQuestionOptionDto } from "../dtos/payload/questions_options-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nService } from "nestjs-i18n";

@Injectable()
export class QuestionsOptionsService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(QuestionOption))
    private readonly repository: Repository<QuestionOption>,
  ) {}

  async create(dto: CreateQuestionOptionDto): Promise<any> {
    return {
      status: "success",
      message: this.i18n.t("questions_options.CREAR_RES"),
      data: { id: "uuid-opt-123", ...dto },
    };
  }

  async findAll(_where?: string): Promise<any[]> {
    return [
      { id: "uuid-opt-123", question_id: "uuid-q-1", option_text: "A favor", order_index: 1, is_active: true },
      { id: "uuid-opt-124", question_id: "uuid-q-1", option_text: "En contra", order_index: 2, is_active: true }
    ];
  }

  async update(id: string, dto: CreateQuestionOptionDto): Promise<any> {
    return { status: "success", message: this.i18n.t("questions_options.ACTUALIZADA_RES"), data: { id, ...dto } };
  }

  async delete(id: string): Promise<any> {
    return { status: "success", message: this.i18n.t("questions_options.ELIMINADA_RES") };
  }
}