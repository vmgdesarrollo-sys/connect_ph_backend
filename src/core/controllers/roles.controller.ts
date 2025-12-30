import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dtos/payload/create-role.dto';
import { AuthGuard } from '../utils/auth.guard';

@UseGuards(AuthGuard)
@ApiTags('Roles') // Agrupa en Swagger
@ApiBearerAuth('access-token')
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