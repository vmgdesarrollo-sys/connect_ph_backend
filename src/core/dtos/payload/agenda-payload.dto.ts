import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('agenda', key, lang);

export class CreateRoleDto {
  @ApiProperty({ 
    example: t('NAME_EXAMPLE'), 
    description: t('NAME_DESC') 
  })
  @IsString()
  @IsNotEmpty({ message: t('NAME_REQUIRED') })
  name: string;

  @ApiProperty({ 
    example: t('DESC_EXAMPLE'), 
    description: t('DESC_LABEL'),
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: t('SCOPES_EXAMPLE'), 
    description: t('SCOPES_DESC'),
    required: false 
  })
  @IsString()
  @IsOptional()
  scopes?: string;
}