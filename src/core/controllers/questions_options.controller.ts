import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { QuestionsOptionsService } from "../services/questions_options.service";
import { CreateQuestionOptionDto } from "../dtos/payload/questions_options-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { CreateQuestionOptionResponseDto, QuestionOptionListResponseDto } from "../dtos/responses/questions_options-response.dto";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('questions_options', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("question-options")
export class QuestionsOptionsController {
  constructor(private readonly service: QuestionsOptionsService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR_RES') })
  @ApiResponse({ status: 201, type: CreateQuestionOptionResponseDto })
  async create(@Body() dto: CreateQuestionOptionDto) {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR_RES') })
  @ApiResponse({ status: 200, type: QuestionOptionListResponseDto })
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
  @ApiResponse({ status: 200 })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateQuestionOptionDto) {
    return await this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200 })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.service.delete(id);
  }
}