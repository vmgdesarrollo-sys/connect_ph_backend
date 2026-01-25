import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { AssemblyAnnouncementsService } from "../services/assembly_announcements.service";
import { CreateAnnouncementDto } from "../dtos/payload/assembly_announcements-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { 
  CreateAnnouncementResponseDto, 
  AnnouncementListResponseDto, 
  GetAnnouncementResponseDto, 
  DeleteAnnouncementResponseDto,
  UpdateAnnouncementResponseDto // Asegúrate de agregarlo a tus DTOs de respuesta
} from "../dtos/responses/assembly_announcements-response.dto";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = "es";
const t = (key: string) => getSwaggerText('assembly_announcements', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("assembly_announcements")
export class AssemblyAnnouncementsController {
  constructor(private readonly announcementsService: AssemblyAnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR_RES') })
  @ApiResponse({ status: 201, type: CreateAnnouncementResponseDto })
  async create(@Body() dto: CreateAnnouncementDto) {
    return await this.announcementsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR_RES') })
  @ApiResponse({ status: 200, type: AnnouncementListResponseDto })
  async findAll(@Query("_where") _where?: string) {
    const data = await this.announcementsService.findAll(_where);
    return {
      status: "success",
      message: t('LISTAR_RES'),
      data,
      properties: { total_items: data.length, items_per_page: 100, current_page: 1, total_pages: 1 }
    };
  }

  @Get(":id")
  @ApiOperation({ summary: t('DETALLE_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: GetAnnouncementResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.announcementsService.findOne(id);
  }

  // --- Método PUT agregado ---
  @Put(":id")
  @ApiOperation({ summary: t('ACTUALIZADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: UpdateAnnouncementResponseDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateAnnouncementDto) {
    return await this.announcementsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: t('ELIMINADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: DeleteAnnouncementResponseDto })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.announcementsService.delete(id);
  }
}