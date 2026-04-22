import { ApiProperty } from "@nestjs/swagger";
import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText("units", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);
const p = (key: string) => getSwaggerText("phs", key, lang);

class UnitDataDto {
  @ApiProperty({ example: t("ID_EXAMPLE") })
  id: string;

  @ApiProperty({ example: t('BOLCK_EXAM'), description: t('BLOCK_DESC') })
  block: string;

  @ApiProperty({ example: t("UNIT_NUMBER_EXAM"), description: t('UNIT_NUMBER_DESC') })
  unit_number: string;

  @ApiProperty({ example: t("TYPE_EXAM"), description: t('TYPE_DESC') })
  type: string;

  @ApiProperty({ example: t('COEFFICIENT_EXAM'), description: t('COEFFICIENT_DESC') })
  coefficient: string;

  @ApiProperty({ example: t('FLOOR_EXAM'), description: t('FLOOR_DESC'), required: true })
  floor: string;

  @ApiProperty({ example: t("AREA_EXAM"), description: t('AREA_DESC'), required: false })
  area?: string;

  @ApiProperty({ example: t('TAX_RESPONSABLE_EXAM'), description: t('TAX_RESPONSABLE_DESC'), required: false })
  tax_responsible?: string;

  @ApiProperty({ example: t('TAX_RESPONSABLE_DOC_TYPE_EXAM'), description: t('TAX_RESPONSABLE_DOC_TYPE_DESC'), required: false })
  tax_responsible_document_type?: string;

  @ApiProperty({ example: t('TAX_RESPONSABLE_DOC_EXAM'), description: t('TAX_RESPONSABLE_DOC_DESC'), required: false })
  tax_responsible_document?: string;

  @ApiProperty({ example: true })
  is_active?: boolean;

  @ApiProperty({
    example: "2026-01-08 12:00:00",
    description: t("CREATED_AT_DESC"),
  })
  created_at: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: g("TOTAL") })
  total_items: number;

  @ApiProperty({ example: 10, description: g("PER_PAGE") })
  items_per_page: number;

  @ApiProperty({ example: 1, description: g("CURRENT") })
  current_page: number;

  @ApiProperty({ example: 1, description: g("TOTAL_PAGES") })
  total_pages: number;
}

// --- Respuestas Finales ---

export class CreateUnitResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_CREATE") })
  message: string;

  @ApiProperty({ type: UnitDataDto })
  data: UnitDataDto;
}

export class GetUnitResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_GET") })
  message: string;

  @ApiProperty({ type: UnitDataDto })
  data: UnitDataDto;
}

export class UpdateUnitResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_UPDATE") })
  message: string;

  @ApiProperty({ type: UnitDataDto })
  data: UnitDataDto;
}

export class CreateUnitResponseErrorDto {
  @ApiProperty({ example: t("MSG_ERROR_DATA") })
  message: string;

  @ApiProperty({ example: g("BAD_REQUEST") })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class UnitsListResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_LIST") })
  message: string;

  @ApiProperty({ type: [UnitDataDto] })
  data: UnitDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: any;
}

export class DeleteUnitResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_DELETE") })
  message: string;
}