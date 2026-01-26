import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { VotingQuestionsService } from "../services/voting_questions.service";
import { CreateVotingQuestionDto } from "../dtos/payload/voting_questions-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { 
  CreateVotingQuestionResponseDto, 
  VotingQuestionListResponseDto, 
  UpdateVotingQuestionResponseDto 
} from "../dtos/responses/voting_questions-response.dto";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('voting_questions', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("voting-questions")
export class VotingQuestionsController {
  constructor(private readonly service: VotingQuestionsService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR_RES') })
  @ApiResponse({ status: 201, type: CreateVotingQuestionResponseDto })
  async create(@Body() dto: CreateVotingQuestionDto) {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR_RES') })
  @ApiResponse({ status: 200, type: VotingQuestionListResponseDto })
  async findAll(@Query("_where") _where?: string) {
    const data = await this.service.findAll(_where);
    return {
      status: "success",
      message: t('LISTAR_RES'),
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }

  @Put(":id")
  @ApiOperation({ summary: t('ACTUALIZADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: UpdateVotingQuestionResponseDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateVotingQuestionDto) {
    return await this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200 })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.service.delete(id);
  }
}