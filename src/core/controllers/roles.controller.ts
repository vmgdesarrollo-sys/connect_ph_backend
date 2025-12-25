import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dtos/create-role.dto';

@ApiTags('Roles') // Agrupa en Swagger
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol (ADMIN, RESIDENT, etc)' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los roles activos' })
  async findAll() {
    return await this.rolesService.findAll();
  }

  @Post('seed')
  @ApiOperation({ summary: 'Insertar roles por defecto del sistema' })
  async seed() {
    return await this.rolesService.seedRoles();
  }
}