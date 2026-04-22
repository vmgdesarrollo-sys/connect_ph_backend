import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "../../dtos/general.dto";
import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText('assemblies', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class AssemblyDataDto {
  @ApiProperty({ example: t("UUID") })
  id: string;

  @ApiProperty({ example: t("UUID"), description: t("PHS_ID_DESC") })
  phs_id: string;

  @ApiProperty({ example: t("NAME") })
  name: string;

  @ApiProperty({ example: t("DESCRIPTION") })
  description: string;

  @ApiProperty({ example: t("TYPE") })
  type: string;

  @ApiProperty({ example: t("STATUS") })
  status: string;

  @ApiProperty({ example: t("SCHEDULED") })
  scheduled_at: Date;

  @ApiProperty({ example: "2026-03-15T08:05:00Z" })
  started_at: Date;

  @ApiProperty({ example: "2026-03-15T12:00:00Z" })
  finished_at: Date;

  @ApiProperty({ example: t("LIVEKIT") })
  livekit_room_name: string;

  @ApiProperty({ example: t("QUORUM") })
  quorum_requirement: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: t("CREATED_AT") })
  created_at: Date;
}

// --- Response para CREAR ---
export class CreateAssemblyResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("CREAR_RES") })
  message: string;

  @ApiProperty({ type: AssemblyDataDto })
  data: AssemblyDataDto;
}

// --- Response para OBTENER DETALLE (Faltante) ---
export class GetAssemblyResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("DETALLE_RES") })
  message: string;

  @ApiProperty({ type: AssemblyDataDto })
  data: AssemblyDataDto;
}

// --- Response para ACTUALIZAR (Faltante) ---
export class UpdateAssemblyResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("ACTUALIZADA_RES") })
  message: string;

  @ApiProperty({ type: AssemblyDataDto })
  data: AssemblyDataDto;
}

// --- Response para ELIMINAR (Faltante) ---
export class DeleteAssemblyResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("ELIMINADA_RES") })
  message: string;
}

// --- Response para LISTADO ---
export class AssemblyListResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("LISTAR_RES") })
  message: string;

  @ApiProperty({ type: [AssemblyDataDto] })
  data: AssemblyDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: PaginationMetaDto;
}

// --- Response para ERRORES (401/400) ---
export class CreateAssemblyResponseErrorDto {
  @ApiProperty({ example: g("DATA_ERROR") })
  message: string;

  @ApiProperty({ example: g("BAD_REQUEST") })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}