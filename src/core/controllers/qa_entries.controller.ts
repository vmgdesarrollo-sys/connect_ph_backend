import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
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