import {
  Controller, Put, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards,
} from "@nestjs/common";
import {
  ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam,
} from "@nestjs/swagger";
import { AgendaService } from "../services/agenda.service";
import { CreateAgendaDto } from "../dtos/payload/agenda-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import {
  CreateAgendaResponseDto,
  UpdateAgendaResponseDto,
  AgendaListResponseDto,
  GetAgendaResponseDto,
  DeleteAgendaResponseDto,
  CreateAgendaResponseErrorDto
} from "../dtos/responses/agenda-response.dto";
import { AuthErrorDto } from "../dtos/general.dto";
import { I18nContext, I18nService } from 'nestjs-i18n';
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('agenda', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("agenda")
@ApiResponse({ status: 403, description: g('AUTH_ERROR'), type: AuthErrorDto })
@ApiResponse({ status: 401, description: g('DATA_ERROR'), type: CreateAgendaResponseErrorDto })
export class AgendaController {
  constructor(private readonly i18n: I18nService, private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR'), description: t('CREAR_DESC') })
  @ApiResponse({ status: 201, description: t('CREAR_RES'), type: CreateAgendaResponseDto })
  async create(@Body() createAgendaDto: CreateAgendaDto) {
    return await this.agendaService.create(createAgendaDto);
  }

  @Put(":id")
  @ApiParam({ name: "id", description: t('UUID_AGENDA'), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiOperation({ summary: t('ACTUALIZAR'), description: t('ACTUALIZAR_DESC') })
  @ApiResponse({ status: 200, description: t('ACTUALIZADA_RES'), type: UpdateAgendaResponseDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() createAgendaDto: CreateAgendaDto) {
    return await this.agendaService.update(id, createAgendaDto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR'), description: t('LISTAR_DESC') })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({ name: "_fields", required: false, example: "*" })
  @ApiQuery({ name: "_where", required: false, example: "(assembly_id=uuid)" })
  @ApiResponse({ status: 200, description: t('LISTAR_RES'), type: AgendaListResponseDto })
  async findAll(@Query("_fields") _fields?: string, @Query("_where") _where?: string) {
    const data = await this.agendaService.findAll(_fields, _where),
      limit = 100,
      page = 1;

    return {
      status: "success",
      message: t('LISTAR_RES'),
      data: data,
      properties: {
        total_items: data.length,
        items_per_page: limit,
        current_page: page,
        total_pages: Math.ceil(data.length / limit)
      },
    };
  }

  @Get(":id")
  @ApiOperation({ summary: t('OBTENER') })
  @ApiParam({ name: "id", description: t('UUID_AGENDA') })
  @ApiResponse({ status: 200, description: t('ACTUALIZADA_RES'), type: GetAgendaResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.agendaService.findOne(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: t('ELIMINAR') })
  @ApiParam({ name: "id", description: t('UUID_AGENDA') })
  @ApiResponse({ status: 200, description: t('OBTENER'), type: DeleteAgendaResponseDto })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.agendaService.delete(id);
  }
}