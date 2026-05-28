import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vote } from "../entities/votes.entity";
import { VotingQuestion } from "../entities/voting_questions.entity";
import { QuestionOption } from "../entities/questions_options.entity";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { CreateVoteDto } from "../dtos/payload/votes-payload.dto";
import { I18nService } from "nestjs-i18n";

// Servicio para gestionar los votos en una votación
@Injectable()
export class VotesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Vote)
    private readonly repository: Repository<Vote>,
    @InjectRepository(VotingQuestion)
    private readonly votingQuestionRepository: Repository<VotingQuestion>,
    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,
    @InjectRepository(AssemblyAttendance)
    private readonly attendanceRepository: Repository<AssemblyAttendance>,
  ) {}
// Crear un nuevo voto para una pregunta de votación
// Se asegura que un usuario solo pueda votar una vez por pregunta
  async create(dto: CreateVoteDto): Promise<any> {
    const votingQuestion = await this.votingQuestionRepository.findOne({
      where: { id: dto.voting_questions_id, is_active: true },
    });

    if (!votingQuestion) {
      throw new NotFoundException(this.i18n.t("voting_questions.NO_ENCONTRADA"));
    }

    if (String(votingQuestion.status || '').toUpperCase() !== 'OPEN') {
      throw new ConflictException(
        this.i18n.t("votes.VOTING_NOT_OPEN") || "Voting is not open"
      );
    }

    const selectedOption = await this.questionOptionRepository.findOne({
      where: {
        id: dto.questions_options_id,
        question_id: dto.voting_questions_id,
        is_active: true,
      },
    });

    if (!selectedOption) {
      throw new NotFoundException(this.i18n.t("questions_options.NO_ENCONTRADA"));
    }

    const attendance = await this.attendanceRepository.findOne({
      where: { id: dto.assembly_attendances_id },
      relations: ['unitAssignment', 'unitAssignment.unit'],
    });

    if (!attendance) {
      throw new NotFoundException(this.i18n.t("assembly_attendances.NOT_FOUND"));
    }

    if (!attendance.is_present) {
      throw new ConflictException(this.i18n.t("votes.NOT_PRESENT") || "El usuario no está presente en la asamblea");
    }

    if (!attendance.unitAssignment?.can_vote) {
      throw new ConflictException(this.i18n.t("votes.NOT_ALLOWED") || "La unidad asignada no tiene permiso para votar");
    }

    const existingVote = await this.repository.findOne({
      where: {
        voting_questions_id: dto.voting_questions_id,
        assembly_attendances_id: dto.assembly_attendances_id,
      },
    });

    if (existingVote) {
      throw new ConflictException(this.i18n.t("votes.DUPLICATE_VOTE"));
    }

    const safeCoefficient = attendance.unitAssignment?.unit?.coefficient;

    const newVote = this.repository.create(dto);
    if (safeCoefficient !== undefined && safeCoefficient !== null) {
      newVote.coefficient_at_voting = Number(safeCoefficient);
    }

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

  // Obtener resultados agregados por pregunta de votación
  async getResultsByQuestion(questionId: string): Promise<any> {
    const question = await this.votingQuestionRepository.findOne({
      where: { id: questionId, is_active: true },
    });

    if (!question) {
      throw new NotFoundException(this.i18n.t("voting_questions.NO_ENCONTRADA"));
    }

    const options = await this.questionOptionRepository.find({
      where: { question_id: questionId, is_active: true },
      order: { order_index: 'ASC' },
    });

    const votes = await this.repository.find({
      where: { voting_questions_id: questionId },
    });

    const totalVotes = votes.length;
    const byOptionMap = new Map<string, Vote[]>();

    for (const vote of votes) {
      const list = byOptionMap.get(vote.questions_options_id) || [];
      list.push(vote);
      byOptionMap.set(vote.questions_options_id, list);
    }

    const results = options.map((option) => {
      const optionVotes = byOptionMap.get(option.id) || [];
      const votesCount = optionVotes.length;
      const percentage = totalVotes > 0 ? Number(((votesCount / totalVotes) * 100).toFixed(2)) : 0;
      const coefficientTotal = optionVotes.reduce(
        (acc, current) => acc + Number(current.coefficient_at_voting || 0),
        0,
      );

      return {
        option_id: option.id,
        option_text: option.option_text,
        votes_count: votesCount,
        percentage,
        coefficient_total: Number(coefficientTotal.toFixed(6)),
      };
    });

    return {
      status: "success",
      message: this.i18n.t("votes.RESULTS_RES") || "Resultados de votación obtenidos",
      data: {
        question_id: question.id,
        question_text: question.question_text,
        total_votes: totalVotes,
        options: results,
      },
    };
  }
}