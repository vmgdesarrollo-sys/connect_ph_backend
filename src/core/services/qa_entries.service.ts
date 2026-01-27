import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { QaEntry } from "../entities/qa_entries.entity";
import { CreateQaEntryDto, UpdateQaEntryDto } from "../dtos/payload/qa_entries-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nService } from "nestjs-i18n";

@Injectable()
export class QaEntriesService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(QaEntry))
    private readonly qaRepository: Repository<QaEntry>,
  ) {}

  async create(dto: CreateQaEntryDto): Promise<any> {
    return {
      status: "success",
      message: this.i18n.t("qa_entries.CREAR_RES"),
      data: { id: "uuid-qa-123", ...dto, status: "Pendiente", upvotes: 0, created_at: new Date() },
    };
  }

  async findAll(_where?: string): Promise<any[]> {
    return [
      {
        id: "uuid-qa-123",
        question_text: "¿Cuándo se entregan los estados financieros?",
        status: "Respondida",
        answer_text: "Ya están disponibles en la plataforma.",
        upvotes: 10,
        created_at: new Date(),
      }
    ];
  }

  async update(id: string, dto: UpdateQaEntryDto): Promise<any> {
    return {
      status: "success",
      message: this.i18n.t("qa_entries.ACTUALIZADA_RES"),
      data: { id, ...dto },
    };
  }

  async delete(id: string): Promise<any> {
    return { status: "success", message: this.i18n.t("qa_entries.ELIMINADA_RES") };
  }
}