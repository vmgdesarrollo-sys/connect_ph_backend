import { Controller, Put, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PhsService } from '../services/phs.service';
import { CreatePhDto } from '../dtos/payload/create-ph.dto';
import { AuthGuard } from '../utils/auth.guard';
import { CreatePhResponseDto, CreatePhResponseErrorDto, CreatePhResponseErrorTaxIdDto, PhsListResponseDto } from '../dtos/responses/ph-response.dto';

@UseGuards(AuthGuard)
@ApiTags('Copropiedades (PHs)')
@ApiBearerAuth('access-token')
@Controller('phs')
export class PhsController {
  constructor(private readonly phsService: PhsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Servicio para creación de copropiedades.', 
    description: 'Crear copropiedades en bases de datos.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'La copropiedad ha sido creada correctamente.',
    type: CreatePhResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Los datos de la copropiedad son incorrectos.',
    type: CreatePhResponseErrorDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'tax_id (NIT) ya existe.',
    type: CreatePhResponseErrorTaxIdDto
  })
  async create(@Body() createPhDto: CreatePhDto) {
    return await this.phsService.create(createPhDto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Servicio para actualización de copropiedades.', 
    description: 'Actualizar copropiedades en bases de datos.' 
  })
  async update(@Body() createPhDto: CreatePhDto) {
    return await this.phsService.create(createPhDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todas las copropiedades', 
    description: 'Obtiene un listado de las copropiedades registradas con soporte para filtros.' 
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: '_fields', required: false, example: "*" })
  @ApiQuery({ name: '_where', required: false, example: "(id=1 AND name=ph1)" })
  @ApiResponse({ 
    status: 200, 
    description: 'Retorno de las copropiedades almacenadas en bases de datos por bloques de 100.',
    type: PhsListResponseDto
  })
  async findAll(@Query('_fields') _fields?: string,
    @Query('_where') _where?: string) {    
    const phs= await this.phsService.findAll(), limit=100, page=1;

    return {
      status: 'success',
      message: 'Listado de copropiedades obtenido correctamente',
      data: phs,
      properties: {
        total_items: phs.length,
        items_per_page: limit,
        current_page: page,
        total_pages: Math.ceil(phs.length / limit),
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.phsService.findOne(id);
  }
  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.phsService.delete(id);
  }
}