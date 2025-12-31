import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/payload/create-user.dto';
import { AuthGuard } from '../utils/auth.guard';

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@UseGuards(AuthGuard)
@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario en el sistema' })
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los usuarios' })
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un usuario por su ID (UUID)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usersService.findOne(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar un usuario por su correo electrónico' })
  async findByEmail(@Param('email') email: string) {
    return await this.usersService.findByEmail(email);
  }
}