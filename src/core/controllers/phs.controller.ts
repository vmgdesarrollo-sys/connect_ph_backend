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

@UseGuards(AuthGuard)
@ApiTags("Copropiedades (PHs)")
@ApiBearerAuth("access-token")
@Controller("phs")
@ApiResponse({
  status: 403,
  description: "Error de autenticación.",
  type: AuthErrorDto,
})
@ApiResponse({
  status: 401,
  description: "Los datos informados son incorrectos.",
  type: CreatePhResponseErrorDto,
})
export class PhsController {
  constructor(private readonly phsService: PhsService) {}

  // Create register
  @Post()
  @ApiOperation({
    summary: "Servicio para creación de copropiedades.",
    description: "Crear copropiedades en bases de datos.",
  })
  @ApiResponse({
    status: 201,
    description: "La copropiedad ha sido creada correctamente.",
    type: CreatePhResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "tax_id (NIT) ya existe.",
    type: CreatePhResponseErrorTaxIdDto,
  })
  async create(@Body() createPhDto: CreatePhDto) {
    return await this.phsService.create(createPhDto);
  }

  // Update Service
  @Put(":id")
  @ApiParam({
    name: "id",
    description: "ID único de la copropiedad (UUID)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiOperation({
    summary: "Servicio para actualización de copropiedades.",
    description: "Actualizar copropiedades en bases de datos.",
  })
  @ApiResponse({
    status: 200,
    description: "La copropiedad ha sido actualizada correctamente.",
    type: UpdatePhResponseDto,
  })
  async update(@Body() createPhDto: CreatePhDto) {
    return await this.phsService.update(createPhDto);
  }

  // Get all registers
  @Get()
  @ApiOperation({
    summary: "Listar todas las copropiedades",
    description: "Obtiene un listado de las copropiedades registradas con soporte para filtros.",
  })
  @ApiBearerAuth("access-token")
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({ name: "_fields", required: false, example: "*" })
  @ApiQuery({ name: "_where", required: false, example: "(id=1 AND name=ph1)" })
  @ApiResponse({
    status: 200,
    description:
      "Retorno de las copropiedades almacenadas en bases de datos por bloques de 100.",
    type: PhsListResponseDto,
  })
  async findAll(
    @Query("_fields") _fields?: string,
    @Query("_where") _where?: string
  ) {
    const phs = await this.phsService.findAll(),
      limit = 100,
      page = 1;

    return {
      status: "success",
      message: "Listado de copropiedades obtenido correctamente",
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
    description: "Obtener detalle de la copropiedad.",
    type: GetPhResponseDto,
  })
  @ApiParam({
    name: "id",
    description: "ID único de la copropiedad (UUID)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.phsService.findOne(id);
  }

  // Delete register per ID
  @Delete(":id")
  @ApiResponse({
    status: 200,
    description: "Obtener detalle de la copropiedad.",
    type: DeletePhResponseDto,
  })
  @ApiParam({
    name: "id",
    description: "ID único de la copropiedad (UUID)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.phsService.delete(id);
  }
}
