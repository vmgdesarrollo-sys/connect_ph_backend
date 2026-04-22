import { ApiProperty } from '@nestjs/swagger';
// import { } from 'class-validator';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const g = (key: string) => getSwaggerText('general', key, lang);

export class AuthErrorDto {
  @ApiProperty({ example: g('ERROR_TOKEN_AUTH') })
  message: string;

  @ApiProperty({ example: g("UNAUTHORIZED") })
  error: string;

  @ApiProperty({ example: 403 })
  statusCode: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 100, description: g('TOTAL_ITEMS_DESC') })
  total_items: number;

  @ApiProperty({ example: 10, description: g('ITEMS_PER_PAGE_DESC') })
  items_per_page: number;

  @ApiProperty({ example: 1, description: g('CURRENT_PAGE_DESC') })
  current_page: number;

  @ApiProperty({ example: 10, description: g('TOTAL_PAGES_DESC') })
  total_pages: number;
}