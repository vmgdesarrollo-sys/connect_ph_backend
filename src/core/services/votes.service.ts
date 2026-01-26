import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { Vote } from "../entities/votes.entity";
import { CreateVoteDto } from "../dtos/payload/votes-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { I18nService } from "nestjs-i18n";

@Injectable()
export class VotesService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(getRepositoryToken(Vote))
    private readonly repository: Repository<Vote>,
  ) {}

  async create(dto: CreateVoteDto): Promise<any> {
    return {
      status: "success",
      message: this.i18n.t("votes.CREAR_RES"),
      data: { 
        id: "uuid-vote-789", 
        ...dto, 
        created_at: new Date() 
      },
    };
  }

  async findAll(_where?: string): Promise<any[]> {
    return [
      {
        id: "uuid-vote-789",
        voting_questions_id: "uuid-q-1",
        questions_options_id: "uuid-opt-yes",
        coefficient_at_voting: 0.012540,
        created_at: new Date(),
      }
    ];
  }

  async delete(id: string): Promise<any> {
    return { status: "success", message: this.i18n.t("votes.ELIMINADA_RES") };
  }
}