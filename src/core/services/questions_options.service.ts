import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { QuestionOption } from "../entities/questions_options.entity";
import { CreateQuestionOptionDto } from "../dtos/payload/questions_options-payload.dto";
import { I18nService, I18nContext } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

// Servicio para gestionar las opciones de preguntas en una votación
@Injectable()
export class QuestionsOptionsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(QuestionOption)
    private readonly repository: Repository<QuestionOption>,
  ) {}

  // Crear una nueva opción de pregunta
  async create(dto: CreateQuestionOptionDto): Promise<any> {
    const newOption = this.repository.create(dto);
    const savedOption = await this.repository.save(newOption);
    
    return {
      status: "success",
      message: this.i18n.t("questions_options.CREAR_RES"),
      data: savedOption,
    };
  }

  // Listar todas las opciones de preguntas activas
  async findAll(_where?: string): Promise<any[]> {
    const options = await this.repository.find({
      where: { is_active: true },
      order: { order_index: 'ASC' },
    });
    return options;
  }

  // Actualizar una opción de pregunta por ID
  async update(id: string, dto: CreateQuestionOptionDto): Promise<any> {
    const option = await this.repository.findOne({ where: { id, is_active: true } });
    
    if (!option) {
      throw new NotFoundException(this.i18n.t("questions_options.NO_ENCONTRADA"));
    }

    Object.assign(option, dto);
    const updatedOption = await this.repository.save(option);
    
    return { 
      status: "success", 
      message: this.i18n.t("questions_options.ACTUALIZADA_RES"), 
      data: updatedOption 
    };
  }
// Eliminar una opción de pregunta por ID (soft delete)
  async delete(id: string): Promise<any> {
    const option = await this.repository.findOne({ where: { id, is_active: true } });
    
    if (!option) {
      throw new NotFoundException(this.i18n.t("questions_options.NO_ENCONTRADA"));
    }

    option.is_active = false;
    await this.repository.save(option);
    
    return { 
      status: "success", 
      message: this.i18n.t("questions_options.ELIMINADA_RES", { lang }) 
    };
  }

  // Obtener opciones de una pregunta de votación específica
  async findByVotingQuestionId(votingQuestionId: string): Promise<any> {
    const options = await this.repository.find({
      where: { 
        question_id: votingQuestionId, 
        is_active: true 
      },
      order: { order_index: 'ASC' },
    });

    return {
      status: "success",
      message: this.i18n.t("questions_options.LISTAR_POR_VOTING_QUESTION_RES", { lang }),
      data: options,
    };
  }
}