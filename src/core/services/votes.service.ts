import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vote } from "../entities/votes.entity";
import { CreateVoteDto } from "../dtos/payload/votes-payload.dto";
import { I18nService } from "nestjs-i18n";

// Servicio para gestionar los votos en una votación
@Injectable()
export class VotesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Vote)
    private readonly repository: Repository<Vote>,
  ) {}
// Crear un nuevo voto
  async create(dto: CreateVoteDto): Promise<any> {
    const newVote = this.repository.create(dto);
    const savedVote = await this.repository.save(newVote);
    
    return {
      status: "success",
      message: this.i18n.t("votes.CREAR_RES"),
      data: savedVote,
    };
  }
// Listar todos los votos
  async findAll(_where?: string): Promise<any[]> {
    const votes = await this.repository.find();
    return votes;
  }
// Eliminar un voto por ID
  async delete(id: string): Promise<any> {
    const vote = await this.repository.findOne({ where: { id } });
    
    if (!vote) {
      throw new NotFoundException(this.i18n.t("votes.NO_ENCONTRADO"));
    }

    await this.repository.remove(vote);
    
    return { 
      status: "success", 
      message: this.i18n.t("votes.ELIMINADA_RES") 
    };
  }
}