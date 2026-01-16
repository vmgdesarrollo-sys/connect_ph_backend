import { ApiProperty } from "@nestjs/swagger";
import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText("users", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);
const p = (key: string) => getSwaggerText("phs", key, lang);

class UserDataDto {
  @ApiProperty({ example: t("ID_EXAMPLE") })
  id: string;

  @ApiProperty({ example: t("FIRST_NAME"), description: t("FIRST_NAME_DESC") })
  first_name: string;

  @ApiProperty({ example: t("LAST_NAME"), description: t("LAST_NAME_DESC") })
  last_name: string;

  @ApiProperty({ example: "Natural", description: t("TYPE_DESC") })
  type_person: string;

  @ApiProperty({ example: "M", description: t("GENDER_DESC") })
  gender: string;

  @ApiProperty({ example: t("AVATAR"), description: t("AVATAR_DESC") })
  avatar_url: string;

  @ApiProperty({
    example: t("EMAIL"),
    description: t("EMAIL_DESC"),
    required: false,
  })
  email?: string;

  @ApiProperty({
    example: "CC",
    description: t("DOC_TYPE_DESC"),
    required: false,
  })
  document_type?: string;

  @ApiProperty({
    example: t("DOC_NUM"),
    description: t("DOC_NUM_DESC"),
    required: false,
  })
  document_number?: string;

  @ApiProperty({
    example: t("PHONE"),
    description: t("PHONE_DESC"),
    required: false,
  })
  phone_number?: string;

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

export class CreateUserResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_CREATE") })
  message: string;

  @ApiProperty({ type: UserDataDto })
  data: UserDataDto;
}

export class GetUserResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_GET") })
  message: string;

  @ApiProperty({ type: UserDataDto })
  data: UserDataDto;
}

export class UpdateUserResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_UPDATE") })
  message: string;

  @ApiProperty({ type: UserDataDto })
  data: UserDataDto;
}

export class CreateUserResponseErrorDto {
  @ApiProperty({ example: t("MSG_ERROR_DATA") })
  message: string;

  @ApiProperty({ example: g("BAD_REQUEST") })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class UsersListResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_LIST") })
  message: string;

  @ApiProperty({ type: [UserDataDto] })
  data: UserDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: any;
}

export class DeleteUserResponseDto {
  @ApiProperty({ example: g("SUCCESS") })
  status: string;

  @ApiProperty({ example: t("MSG_DELETE") })
  message: string;
}

export class Ownership{
  @ApiProperty({ example: p("ID_EXAMPLE") })
  id: string;

  @ApiProperty({ example: p("EXAMPLE_PH_NAME") })
  name: string;

  @ApiProperty({ example: p("EXAMPLE_PH_TAX") })
  tax_id: string;

  @ApiProperty({ example: p("EXAMPLE_PH_ADDRESS") })
  address: string;

  @ApiProperty({ example: p("EXAMPLE_CITY") })
  city: string;

  @ApiProperty({ example: p("EXAMPLE_COUNTRY") })
  country: string;

  @ApiProperty({ example: p("EXAMPLE_STATE") })
  state: string;
}

export class UserProfileResponseDto{
  @ApiProperty({ example: t("EMAIL") })
  email: string;

  @ApiProperty({ example: t("FIRST_NAME") })
  firstName: string;

  @ApiProperty({ example: t("LAST_NAME") })
  lastName: string;

  @ApiProperty({ example: t("DOC_NUM") })
  document: string;

  @ApiProperty({ example: t("DOC_NUM_TYPE") })
  documentType: string;

  @ApiProperty({ example: t("PHONE") })
  phone: string;

  @ApiProperty({ example: t("AVATAR") })
  avatar: string;

  @ApiProperty({ example: ["admin"] })
  roles: string[];
}

export class GetUserProfileResponseDto{
  @ApiProperty({ type: UserProfileResponseDto })
  userProfile: UserProfileResponseDto;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  userId: string;

  @ApiProperty({ type: Ownership })
  ownership: Ownership;

  @ApiProperty({ example: "read/write" })
  scope: string;
}