import {
  Controller, Put, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards,
} from "@nestjs/common";
import {
  ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam,
} from "@nestjs/swagger";
import { AssembliesService } from "../services/assemblies.service";
import { CreateAssemblyDto } from "../dtos/payload/assemblies-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import {
  CreateAssemblyResponseDto,
  AssemblyListResponseDto,
  GetAssemblyResponseDto, // Asegúrate de tenerlo en tus responses
  DeleteAssemblyResponseDto,
  UpdateAssemblyResponseDto,
} from "../dtos/responses/assemblies-response.dto";
import { AuthErrorDto } from "../dtos/general.dto";
import { I18nContext, I18nService } from 'nestjs-i18n';
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('assemblies', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("assemblies")
@ApiResponse({ status: 403, description: g('AUTH_ERROR'), type: AuthErrorDto })
export class AssembliesController {
  constructor(private readonly assembliesService: AssembliesService) {}

  // 1. Crear Asamblea
  @Post()
  @ApiOperation({ summary: t('CREAR_RES') })
  @ApiResponse({ status: 201, type: CreateAssemblyResponseDto })
  async create(@Body() dto: CreateAssemblyDto) {
    return await this.assembliesService.create(dto);
  }

  // 2. Listar todas las Asambleas (con filtros)
  @Get()
  @ApiOperation({ summary: t('LISTAR_RES') })
  @ApiQuery({ name: "_fields", required: false, example: "*" })
  @ApiQuery({ name: "_where", required: false, example: "(phs_id=uuid)" })
    @ApiQuery({ name: "phs_id", required: false, description: "UUID del conjunto (PH)", example: "00000000-0000-0000-0000-000000000000" })
  @ApiResponse({ status: 200, type: AssemblyListResponseDto })
    async findAll(
      @Query("_fields") _fields?: string,
      @Query("_where") _where?: string,
      @Query("phs_id") phs_id?: string
    ) {
      const data = await this.assembliesService.findAll(phs_id ? { phs_id } : undefined);
      const limit = 100, page = 1;

      return {
        status: "success",
        message: t('LISTAR_RES'),
        data,
        properties: {
          total_items: data.length,
          items_per_page: limit,
          current_page: page,
          total_pages: Math.ceil(data.length / limit)
        },
      };
    }

  // 2.1 Listar asambleas por ID de PH (copropiedad)
  @Get("ph/:phsId")
  @ApiOperation({ summary: t('LISTAR_POR_PH_RES') || 'Listar asambleas por PH' })
  @ApiParam({ name: "phsId", description: t('PHS_ID_DESC') })
  @ApiResponse({ status: 200, type: AssemblyListResponseDto })
  async findByPh(@Param("phsId", ParseUUIDPipe) phsId: string) {
    const data = await this.assembliesService.findByPh(phsId);
    const limit = 100, page = 1;

    return {
      status: "success",
      message: t('LISTAR_POR_PH_RES') || 'Listado de asambleas por PH',
      data,
      properties: {
        total_items: data.length,
        items_per_page: limit,
        current_page: page,
        total_pages: Math.ceil(data.length / limit)
      },
    };
  }

  // 3. Obtener una Asamblea por ID
  @Get(":id")
  @ApiOperation({ summary: t('DETALLE_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: GetAssemblyResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.assembliesService.findOne(id);
  }

  // 3.1 Obtener una Asamblea por livekit_room_name
  @Get("livekit/:roomName")
  @ApiOperation({ summary: t('DETALLE_POR_ROOM_RES') || 'Obtener asamblea por room de LiveKit' })
  @ApiParam({ name: "roomName", description: t('LIVEKIT_ROOM_DESC') || 'Nombre de la sala de LiveKit' })
  @ApiResponse({ status: 200, type: GetAssemblyResponseDto })
  async findByLivekitRoomName(@Param("roomName") roomName: string) {
    return await this.assembliesService.findByLivekitRoomName(roomName);
  }

  // 4. Actualizar Asamblea (o cambiar estado)
  @Put(":id")
  @ApiOperation({ summary: t('ACTUALIZADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: UpdateAssemblyResponseDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateAssemblyDto) {
    return await this.assembliesService.update(id, dto);
  }

  // 5. Eliminar Asamblea
  @Delete(":id")
  @ApiOperation({ summary: t('ELIMINADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: DeleteAssemblyResponseDto })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.assembliesService.delete(id);
  }
}