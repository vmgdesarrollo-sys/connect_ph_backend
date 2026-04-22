import { ApiProperty } from "@nestjs/swagger";

import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText('phs', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class PhDataDto {
  @ApiProperty({ example: t("EXAMPLE_UUID") })
  id: string;

  @ApiProperty({ example: t("EXAMPLE_PH_NAME") })
  name: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_TAX"),
    description: t("DESP_PH_TAX"),
  })
  tax_id: string;

  @ApiProperty({ example: t("EXAMPLE_PH_ADDRESS") })
  address?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_PHONE_NUMBER"),
  })
  phone_number?: string;

  @ApiProperty({ example: t("EXAMPLE_PH_EMAIL") })
  email?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_LOGO_URL"),
  })
  logo_url?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_LEGAL_REPRESENTATIVE"),
  })
  legal_representative?: string;

  @ApiProperty({
    example: t("EXAMPLE_CITY"),
    description: t("DESP_CITY"),
    required: false,
  })
  city?: string;

  @ApiProperty({
    example: t("EXAMPLE_STATE"),
    description: t("DESP_STATE"),
    required: false,
  })
  state?: string;

  @ApiProperty({
    example: t("EXAMPLE_COUNTRY"),
    description: t("DESP_COUNTRY"),
    required: false,
  })
  country?: string;

  @ApiProperty({
    example: t("EXAMPLE_STRATUM"),
    description: t("DESP_STRATUM"),
    required: false,
  })
  stratum?: string;

  @ApiProperty({
    example: t("EXAMPLE_NUMBER_OF_TOWERS"),
    description: t("DESP_NUMBER_OF_TOWERS"),
    required: false,
  })
  number_of_towers?: string;

  @ApiProperty({
    example: t("EXAMPLE_AMOUNT_OF_REAL_ESTATE"),
    description: t("DESP_AMOUNT_OF_REAL_ESTATE"),
    required: false,
  })
  amount_of_real_estate?: string;

  @ApiProperty({
    example: t("EXAMPLE_HORIZONTAL_PROPERTY_REGULATIONS"),
    description: t("DESP_HORIZONTAL_PROPERTY_REGULATIONS"),
    required: false,
  })
  horizontal_property_regulations?: string;

  @ApiProperty({ example: true })
  is_active?: boolean;

  @ApiProperty({ example: t("EXAMPLE_CREATED_AT") })
  created_at: Date;
}

export class CreatePhResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({
    example: t("CREAR_COPROPIEDAD_RES"),
  })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class GetPhResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("DETALLE_COPROPIEDAD") })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class UpdatePhResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({
    example: t("COPROPIEDAD_ACTUALIZADA"),
  })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class CreatePhResponseErrorDto {
  @ApiProperty({ example: g("DATA_ERROR") })
  message: string;

  @ApiProperty({ example: g("BAD_REQUEST") })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class CreatePhResponseErrorTaxIdDto {
  @ApiProperty({ example: t("EXAMPLE_TAX_ID_EXIST") })
  message: string;

  @ApiProperty({ example: g("CONFLICTO") })
  error: string;

  @ApiProperty({ example: 409 })
  statusCode: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  total_items: number;

  @ApiProperty({ example: 10 })
  items_per_page: number;

  @ApiProperty({ example: 1 })
  current_page: number;

  @ApiProperty({ example: 1 })
  total_pages: number;
}

export class PhsListResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({
    example: t("RESPUESTA_TODAS_LAS_COPROPIDADES"),
  })
  message: string;

  @ApiProperty({ type: [PhDataDto] }) // El corchete [PhDto] indica que es un array
  data: PhDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: PaginationMetaDto;
}

export class DeletePhResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({
    example: t("COPROPIEDAD_ELIMINADA"),
  })
  message: string;
}
