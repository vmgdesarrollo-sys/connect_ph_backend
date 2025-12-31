import { ApiProperty } from '@nestjs/swagger';
// import { } from 'class-validator';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

export class AuthErrorDto {
  @ApiProperty({ example: getSwaggerText('general', 'ERROR_TOKEN_AUTH', lang) })
  message: string;

  @ApiProperty({ example: getSwaggerText("general", "UNAUTHORIZED", lang) })
  error: string;

  @ApiProperty({ example: 403 })
  statusCode: number;
}
