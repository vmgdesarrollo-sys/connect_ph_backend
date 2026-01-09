import { ApiProperty } from '@nestjs/swagger';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

class PhDataDto {
  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_UUID", lang) })
  id: string;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_PH_NAME", lang) })
  name: string;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_PH_TAX", lang), description: getSwaggerText("phs", "DESP_PH_TAX", lang) })
  tax_id: string;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_PH_ADDRESS", lang) })
  address?: string;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_PH_PHONE_NUMBER", lang) })
  phone_number?: string;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_PH_EMAIL", lang) })
  email?: string;

  @ApiProperty({ 
    example: getSwaggerText("phs", "EXAMPLE_PH_LOGO_URL", lang)
  })
  logo_url?: string;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_PH_LEGAL_REPRESENTATIVE", lang) })
  legal_representative?: string;

  @ApiProperty({ example: true })
  is_active?: boolean;

  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_CREATED_AT", lang) })
  created_at: Date;
}

export class CreatePhResponseDto {
  @ApiProperty({ example: getSwaggerText("general", "SUCCESS", lang) })
  status: string;

  @ApiProperty({ example: getSwaggerText("phs", "CREAR_COPROPIEDAD_RES", lang) })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class GetPhResponseDto {
  @ApiProperty({ example: getSwaggerText("general", "SUCCESS", lang) })
  status: string;

  @ApiProperty({ example: getSwaggerText("phs", "DETALLE_COPROPIEDAD", lang) })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class UpdatePhResponseDto {
  @ApiProperty({ example: getSwaggerText("general", "SUCCESS", lang) })
  status: string;

  @ApiProperty({ example: getSwaggerText("phs", "COPROPIEDAD_ACTUALIZADA", lang) })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class CreatePhResponseErrorDto {
  @ApiProperty({ example: getSwaggerText("general", "DATA_ERROR", lang) })
  message: string;

  @ApiProperty({ example: getSwaggerText('general', 'BAD_REQUEST', lang) })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class CreatePhResponseErrorTaxIdDto {
  @ApiProperty({ example: getSwaggerText("phs", "EXAMPLE_TAX_ID_EXIST", lang) })
  message: string;

  @ApiProperty({ example: getSwaggerText("general", "CONFLICTO", lang) })
  error: string;

  @ApiProperty({ example: 409 })
  statusCode: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total_items: number;

  @ApiProperty({ example: 10 })
  items_per_page: number;

  @ApiProperty({ example: 1 })
  current_page: number;

  @ApiProperty({ example: 10 })
  total_pages: number;
}

export class PhsListResponseDto {
  @ApiProperty({ example: getSwaggerText("general", "SUCCESS", lang) })
  status: string;

  @ApiProperty({ example: getSwaggerText("phs", "RESPUESTA_TODAS_LAS_COPROPIDADES", lang) })
  message: string;

  @ApiProperty({ type: [PhDataDto] }) // El corchete [PhDto] indica que es un array
  data: PhDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: PaginationMetaDto;
}

export class DeletePhResponseDto {
  @ApiProperty({ example: getSwaggerText("general", "SUCCESS", lang) })
  status: string;

  @ApiProperty({ example: getSwaggerText('phs', 'COPROPIEDAD_ELIMINADA', lang) })
  message: string;
}