import { ApiProperty } from "@nestjs/swagger";
import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText("users", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

class UserRolDataDto {
  @ApiProperty({ example: t("ID_EXAMPLE") })
  id: string;

  @ApiProperty({ example: t("USERS_ID"), description: t("USERS_ID_DESC") })
  users_id: string;

  @ApiProperty({ example: t("ROLES_ID"), description: t("ROLES_ID_DESC") })
  roles_id: string;

  @ApiProperty({ example: true })
  is_active?: boolean;

  @ApiProperty({
    example: "2026-01-08 12:00:00",
    description: t("CREATED_AT_DESC"),
  })
  created_at: Date;
}

export class ListRolesDto {
  @ApiProperty({ example: ["admin", "supervisor"], description: g("LIST_DESC") })
  roles: UserRolDataDto[];
}


export class CreateUserRolResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_CREATE") })
  message: string;

  @ApiProperty({ type: ListRolesDto })
  data: ListRolesDto;
}


export class CreateUserRolResponseErrorDto {
  @ApiProperty({ example: t("MSG_ERROR_DATA") })
  message: string;

  @ApiProperty({ example: g("BAD_REQUEST") })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class GetUserRolResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_GET") })
  message: string;

  @ApiProperty({ type: ListRolesDto })
  data: ListRolesDto;
}