import { Controller, Put, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PhsService } from '../services/phs.service';
import { CreatePhDto } from '../dtos/create-ph.dto';
import { AuthGuard } from '../utils/auth.guard';

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
  @ApiQuery({ name: 'name', required: false, description: 'Filtrar por nombre de la PH' })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrar por ciudad' })
  async findAll(@Query('name') name?: string,
    @Query('city') city?: string) {
    return await this.phsService.findAll();
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