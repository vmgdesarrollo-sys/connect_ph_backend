import { ApiProperty } from "@nestjs/swagger";
import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";
import { PaginationMetaDto } from "../../dtos/general.dto";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText('agenda', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class AgendaDataDto {
  @ApiProperty({ example: t("EXAMPLE_UUID") })
  id: string;

  @ApiProperty({ example: "uuid-asamblea-123" })
  assembly_id: string;

  @ApiProperty({ example: t("EXAMPLE_TITLE"), description: t("DESP_TITLE") })
  title: string;

  @ApiProperty({ example: t("EXAMPLE_SORT"), description: t("DESP_SORT") })
  sort_order: number;

  @ApiProperty({ example: true })
  is_votable: boolean;

  @ApiProperty({ example: 51.0, description: t("DESP_QUORUM") })
  required_quorum: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: t("EXAMPLE_CREATED_AT") })
  created_at: Date;
}

export class CreateAgendaResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;
  @ApiProperty({ example: t("CREAR_AGENDA_RES") })
  message: string;
  @ApiProperty({ type: AgendaDataDto })
  data: AgendaDataDto;
}

export class GetAgendaResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;
  @ApiProperty({ example: t("DETALLE_AGENDA") })
  message: string;
  @ApiProperty({ type: AgendaDataDto })
  data: AgendaDataDto;
}

export class UpdateAgendaResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;
  @ApiProperty({ example: t("AGENDA_ACTUALIZADA") })
  message: string;
  @ApiProperty({ type: AgendaDataDto })
  data: AgendaDataDto;
}

export class AgendaListResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;
  @ApiProperty({ example: t("LISTAR_AGENDA") })
  message: string;
  @ApiProperty({ type: [AgendaDataDto] })
  data: AgendaDataDto[];
  @ApiProperty({ type: PaginationMetaDto }) // Asumiendo que está en un archivo común
  properties: any;
}

export class DeleteAgendaResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;
  @ApiProperty({ example: t("AGENDA_ELIMINADA") })
  message: string;
}

export class CreateAgendaResponseErrorDto {
  @ApiProperty({ 
    example: g("DATA_ERROR"),
    description: "Mensaje de error general para datos inválidos" 
  })
  message: string;

  @ApiProperty({ 
    example: g("BAD_REQUEST"),
    description: "Tipo de error HTTP" 
  })
  error: string;

  @ApiProperty({ 
    example: 401,
    description: "Código de estado HTTP" 
  })
  statusCode: number;
}

// Opcional: Error específico si el orden ya existe (409 Conflict)
export class CreateAgendaResponseConflictDto {
  @ApiProperty({ example: t("ERROR_ORDEN_MENSAJE") })
  message: string;

  @ApiProperty({ example: g("CONFLICTO") })
  error: string;

  @ApiProperty({ example: 409 })
  statusCode: number;
}