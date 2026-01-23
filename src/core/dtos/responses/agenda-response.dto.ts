import { ApiProperty } from '@nestjs/swagger';

import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('agenda', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class RolDataDto {
  @ApiProperty({ example: t('ID_EXAMPLE') })
  id: string;

  @ApiProperty({ example: t('NAME_EXAMPLE') })
  name: string;

  @ApiProperty({ example: t('DESC_LABEL') })
  description: string;

  @ApiProperty({ example: t('EXAMPLE_SCOPE'), required: false })
  scopes?: string;

  @ApiProperty({ example: true })
  is_active?: boolean;

  @ApiProperty({ example: "2026-01-08 12:00:00", description: t('CREATED_AT_DESC') })
  created_at: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: g('TOTAL') })
  total_items: number;

  @ApiProperty({ example: 10, description: g('PER_PAGE') })
  items_per_page: number;

  @ApiProperty({ example: 1, description: g('CURRENT') })
  current_page: number;

  @ApiProperty({ example: 1, description: g('TOTAL_PAGES') })
  total_pages: number;
}

// --- Respuestas Finales ---

export class CreateRolResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_CREATE') })
  message: string;

  @ApiProperty({ type: RolDataDto })
  data: RolDataDto;
}

export class GetRolResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_GET') })
  message: string;

  @ApiProperty({ type: RolDataDto })
  data: RolDataDto;
}

export class UpdateRolResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_UPDATE') })
  message: string;

  @ApiProperty({ type: RolDataDto })
  data: RolDataDto;
}

export class CreateRolResponseErrorDto {
  @ApiProperty({ example: t('MSG_ERROR_DATA') })
  message: string;

  @ApiProperty({ example: g('BAD_REQUEST') })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class RolesListResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_LIST') })
  message: string;

  @ApiProperty({ type: [RolDataDto] })
  data: RolDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: PaginationMetaDto;
}

export class DeleteRolResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_DELETE') })
  message: string;
}