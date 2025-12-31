import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

export class CreateRoleDto {
  @ApiProperty({ example: 'RESIDENT', description: 'Nombre único del rol' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  name: string;

  @ApiProperty({ 
    example: 'Persona que vive en la unidad', 
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 'unit:read, assembly:vote, pqrs:create', 
    description: 'Lista de permisos separados por coma o formato JSON',
    required: false 
  })
  @IsString()
  @IsOptional()
  scopes?: string;
}