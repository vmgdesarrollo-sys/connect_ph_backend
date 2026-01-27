import {
  Controller, Put, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards,
} from "@nestjs/common";
import {
  ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam,
} from "@nestjs/swagger";
import { AssemblyAttendancesService } from "../services/assembly_attendances.service";
import { CreateAttendanceDto } from "../dtos/payload/assembly_attendances-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import {
  CreateAttendanceResponseDto,
  AttendanceListResponseDto,
  GetAttendanceResponseDto,
  DeleteAttendanceResponseDto,
  UpdateAttendanceResponseDto,
} from "../dtos/responses/assembly_attendances-response.dto";
import { AuthErrorDto } from "../dtos/general.dto";
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('assembly_attendances', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITULO'))
@ApiBearerAuth("access-token")
@Controller("assembly-attendances")
@ApiResponse({ status: 403, description: g('AUTH_ERROR'), type: AuthErrorDto })
export class AssemblyAttendancesController {
  constructor(private readonly attendancesService: AssemblyAttendancesService) {}

  @Post()
  @ApiOperation({ summary: t('CREAR_RES'), description: 'Registra el ingreso de un participante a la asamblea' })
  @ApiResponse({ status: 201, type: CreateAttendanceResponseDto })
  async create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return await this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: t('LISTAR_RES'), description: 'Obtiene el listado de asistencia (útil para cálculo de quórum)' })
  @ApiQuery({ name: "_where", required: false, example: "(assemblies_id=uuid)", description: "Filtro por asamblea" })
  @ApiResponse({ status: 200, type: AttendanceListResponseDto })
  async findAll(@Query("_where") _where?: string) {
    const data = await this.attendancesService.findAll(_where);
    const limit = 100;
    const page = 1;

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
  @ApiOperation({ summary: t('DETALLE_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: GetAttendanceResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.attendancesService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: t('ACTUALIZADA_RES'), description: 'Actualiza estados de presencia o salida (departure_at)' })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: UpdateAttendanceResponseDto })
  async update(
    @Param("id", ParseUUIDPipe) id: string, 
    @Body() updateAttendanceDto: CreateAttendanceDto
  ) {
    return await this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: t('ELIMINADA_RES') })
  @ApiParam({ name: "id", description: t('ID_DESC') })
  @ApiResponse({ status: 200, type: DeleteAttendanceResponseDto })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.attendancesService.delete(id);
  }
}