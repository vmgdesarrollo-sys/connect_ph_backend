import {
  Controller,
  Put,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { PhsService } from "../services/phs.service";
import { CreatePhDto } from "../dtos/payload/create-ph.dto";
import { AuthGuard } from "../utils/auth.guard";
import {
  CreatePhResponseDto,
  UpdatePhResponseDto,
  CreatePhResponseErrorDto,
  CreatePhResponseErrorTaxIdDto,
  PhsListResponseDto,
  GetPhResponseDto,
  DeletePhResponseDto,
} from "../dtos/responses/ph-response.dto";
import { AuthErrorDto } from "../dtos/general.dto";

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@UseGuards(AuthGuard)
@ApiTags( getSwaggerText('phs', 'COPROPIEDADES_TITULO', lang))
@ApiBearerAuth("access-token")
@Controller("phs")
@ApiResponse({
  status: 403,
  description: getSwaggerText('general', 'AUTH_ERROR', lang),
  type: AuthErrorDto,
})
@ApiResponse({
  status: 401,
  description: getSwaggerText('general', 'DATA_ERROR', lang),
  type: CreatePhResponseErrorDto,
})
export class PhsController {
  constructor(private readonly i18n: I18nService, private readonly phsService: PhsService) {}

  // Create register
  @Post()
  @ApiOperation({
    summary: getSwaggerText('phs', 'CREAR_COPROPIEDAD', lang),
    description: getSwaggerText('phs', 'CREAR_COPROPIEDAD_DESC', lang),
  })
  @ApiResponse({
    status: 201,
    description: getSwaggerText('phs', 'CREAR_COPROPIEDAD_RES', lang),
    type: CreatePhResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: getSwaggerText('phs', 'ERROR_TAX', lang),
    type: CreatePhResponseErrorTaxIdDto,
  })
  async create(@Body() createPhDto: CreatePhDto) {
    return await this.phsService.create(createPhDto);
  }

  // Update Service
  @Put(":id")
  @ApiParam({
    name: "id",
    description: getSwaggerText('phs', 'UUID_PH', lang),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiOperation({
    summary: getSwaggerText('phs', 'SERCIVIO_PH_ACTUALIZACION', lang),
    description: getSwaggerText('phs', 'SERCIVIO_PH_ACTUALIZACION_DESC', lang),
  })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('phs', 'COPROPIEDAD_ACTUALIZADA_RES', lang),
    type: UpdatePhResponseDto,
  })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() createPhDto: CreatePhDto) {
    return await this.phsService.update(id, createPhDto);
  }

  // Get all registers
  @Get()
  @ApiOperation({
    summary: getSwaggerText('phs', 'LISTAR_TODAS_PH', lang),
    description: getSwaggerText('phs', 'LISTAR_TODAS_PH_DESC', lang),
  })
  @ApiBearerAuth("access-token")
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({ name: "_fields", required: false, example: "*" })
  @ApiQuery({ name: "_where", required: false, example: "(id=1 AND name=ph1)" })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('phs', 'LISTAR_TODAS_PH_RES', lang),
    type: PhsListResponseDto,
  })
  async findAll(
    @Query("_fields") _fields?: string,
    @Query("_where") _where?: string
  ) {
    const phs = await this.phsService.findAll(_fields, _where),
      limit = 100,
      page = 1;

    return {
      status: "success",
      message: getSwaggerText('phs', 'LISTAR_TODAS_PH_RESP', lang),
      data: phs,
      properties: {
        total_items: phs.length,
        items_per_page: limit,
        current_page: page,
        total_pages: Math.ceil(phs.length / limit),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Get register per ID
  @Get(":id")
  @ApiResponse({
    status: 200,
    description: getSwaggerText('phs', 'COPROPIEDAD_ACTUALIZADA_RES', lang),
    type: GetPhResponseDto,
  })
  @ApiParam({
    name: "id",
    description: getSwaggerText('phs', 'UUID_PH', lang),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.phsService.findOne(id);
  }

  // Delete register per ID
  @Delete(":id")
  @ApiResponse({
    status: 200,
    description: getSwaggerText('phs', 'OBTENER_PH', lang),
    type: DeletePhResponseDto,
  })
  @ApiParam({
    name: "id",
    description: getSwaggerText('phs', 'UUID_PH', lang),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.phsService.delete(id);
  }
}
