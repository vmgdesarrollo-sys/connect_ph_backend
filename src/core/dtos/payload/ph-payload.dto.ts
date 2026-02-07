import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  IsNumber,
} from "class-validator";

import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText('phs', key, lang);

export class CreatePhDto {
  @ApiProperty({
    example: t("EXAMPLE_PH_NAME"),
    description: t("DESP_PH_NAME"),
  })
  @IsString()
  @IsNotEmpty({ message: t("MSG_PH_NAME") })
  name: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_TAX"),
    description: t("DESP_PH_TAX"),
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: t("MSG_RQD_PH_TAX") })
  tax_id: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_ADDRESS"),
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_PHONE_NUMBER"),
    required: false,
  })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_EMAIL"),
    required: false,
  })
  @IsEmail({}, { message: t("DESP_PH_EMAIL") })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_LOGO_URL"),
    required: false,
    description: t("DESP_PH_LOGO_URL"),
  })
  @IsUrl(
    {},
    { message: t("NO_VALID_PH_LOGO_URL") }
  )
  @IsOptional()
  logo_url?: string;

  @ApiProperty({
    example: t("EXAMPLE_PH_LEGAL_REPRESENTATIVE"),
    description: t("DESP_PH_LEGAL_REPRESENTATIVE"),
    required: false,
  })
  @IsString()
  @IsOptional()
  legal_representative?: string;


  @ApiProperty({
    example: t("EXAMPLE_CITY"),
    description: t("DESP_CITY"),
    required: false,
  })
  @IsString()
  city?: string;

  @ApiProperty({
    example: t("EXAMPLE_STATE"),
    description: t("DESP_STATE"),
    required: false,
  })
  @IsString()
  state?: string;

  @ApiProperty({
    example: t("EXAMPLE_COUNTRY"),
    description: t("DESP_COUNTRY"),
    required: false,
  })
  @IsString()
  country?: string;

  @ApiProperty({
    example: t("EXAMPLE_STRATUM"),
    description: t("DESP_STRATUM"),
    required: false,
  })
  @IsString()
  stratum?: string;

  @ApiProperty({
    example: t("EXAMPLE_NUMBER_OF_TOWERS"),
    description: t("DESP_NUMBER_OF_TOWERS"),
    required: false,
  })
  @IsNumber()
  @IsOptional()
  number_of_towers?: number;

  @ApiProperty({
    example: t("EXAMPLE_AMOUNT_OF_REAL_ESTATE"),
    description: t("DESP_AMOUNT_OF_REAL_ESTATE"),
    required: false,
  })
  @IsNumber()
  @IsOptional()
  amount_of_real_estate?: number;

  @ApiProperty({
    example: t("EXAMPLE_HORIZONTAL_PROPERTY_REGULATIONS"),
    description: t("DESP_HORIZONTAL_PROPERTY_REGULATIONS"),
    required: false,
  })
  @IsString()
  horizontal_property_regulations?: string;
  

  @ApiProperty({
    example: true,
    description: t("DESP_PH_ACTIVE"),
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: t("DESP_PH_CREATED_BY"),
  })
  @IsUUID("4", {
    message: t("VALID_PH_CREATED_BY"),
  })
  @IsNotEmpty()
  created_by: string;
}
