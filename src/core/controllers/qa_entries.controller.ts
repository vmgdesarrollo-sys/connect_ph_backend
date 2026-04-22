import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger";
import { QaEntriesService } from "../services/qa_entries.service";
import { CreateQaEntryDto, UpdateQaEntryDto } from "../dtos/payload/qa_entries-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { CreateQaResponseDto, QaListResponseDto, UpdateQaResponseDto } from "../dtos/responses/qa_entries-response.dto";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('qa_entries', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("qa_entries")
export class QaEntriesController {
  constructor(private readonly qaService: QaEntriesService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR_RES') })
  @ApiResponse({ status: 201, type: CreateQaResponseDto })
  async create(@Body() dto: CreateQaEntryDto) {
    return await this.qaService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR_RES') })
  @ApiResponse({ status: 200, type: QaListResponseDto })
  async findAll(@Query("_where") _where?: string) {
    const data = await this.qaService.findAll(_where);
    return {
      status: "success",
      message: t('LISTAR_RES'),
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }

  // Obtener preguntas por ID de asamblea (para chat en vivo)
  @Get("assembly/:assemblyId")
  @ApiOperation({ summary: t('LISTAR_POR_ASAMBLEA_RES') || 'Listar preguntas por asamblea' })
  @ApiParam({ name: "assemblyId", description: t('ASSEMBLY_ID_DESC') || 'ID de la asamblea' })
  @ApiResponse({ status: 200, type: QaListResponseDto })
  async findByAssembly(@Param("assemblyId", ParseUUIDPipe) assemblyId: string) {
    const data = await this.qaService.findByAssembly(assemblyId);
    return {
      status: "success",
      message: t('LISTAR_POR_ASAMBLEA_RES') || 'Preguntas de la asamblea',
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }

  // Obtener preguntas activas de una asamblea (para chat en vivo)
  @Get("assembly/:assemblyId/active")
  @ApiOperation({ summary: t('LISTAR_ACTIVAS_RES') || 'Listar preguntas activas' })
  @ApiParam({ name: "assemblyId", description: t('ASSEMBLY_ID_DESC') || 'ID de la asamblea' })
  @ApiResponse({ status: 200, type: QaListResponseDto })
  async getActiveQuestions(@Param("assemblyId", ParseUUIDPipe) assemblyId: string) {
    const data = await this.qaService.getActiveQuestions(assemblyId);
    return {
      status: "success",
      message: t('LISTAR_ACTIVAS_RES') || 'Preguntas activas',
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }

  // Obtener preguntas moderadas de una asamblea
  @Get("assembly/:assemblyId/moderated")
  @ApiOperation({ summary: t('LISTAR_MODERADAS_RES') || 'Listar preguntas moderadas' })
  @ApiParam({ name: "assemblyId", description: t('ASSEMBLY_ID_DESC') || 'ID de la asamblea' })
  @ApiResponse({ status: 200, type: QaListResponseDto })
  async getModeratedQuestions(@Param("assemblyId", ParseUUIDPipe) assemblyId: string) {
    const data = await this.qaService.getModeratedQuestions(assemblyId);
    return {
      status: "success",
      message: t('LISTAR_MODERADAS_RES') || 'Preguntas moderadas',
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }

  // Votar por una pregunta
  @Post(":id/upvote")
  @ApiOperation({ summary: t('UPVOTE_RES') || 'Votar por una pregunta' })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: UpdateQaResponseDto })
  async upvote(@Param("id", ParseUUIDPipe) id: string) {
    return await this.qaService.upvote(id);
  }

  @Put(":id")
  @ApiOperation({ summary: t('ACTUALIZADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: UpdateQaResponseDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateQaEntryDto) {
    return await this.qaService.update(id, dto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200 })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.qaService.delete(id);
  }
}