import { ApiProperty } from "@nestjs/swagger";
import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText("unit_assignments", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);


export class ListUnitsDto {
  @ApiProperty({ example: [t("ID_EXAMPLE")], description: g("LIST_DESC") })
  units: string[];
}


export class CreateUserUnitResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_CREATE") })
  message: string;

  @ApiProperty({ type: ListUnitsDto })
  data: ListUnitsDto;
}


export class CreateUserUnitResponseErrorDto {
  @ApiProperty({ example: t("MSG_ERROR_DATA") })
  message: string;

  @ApiProperty({ example: g("BAD_REQUEST") })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class GetUserUnitResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_GET") })
  message: string;

  @ApiProperty({ type: ListUnitsDto })
  data: ListUnitsDto;
}