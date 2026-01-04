import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from "class-validator";

import { I18nContext } from "nestjs-i18n";
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

export class CreatePhDto {
  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_NAME", lang),
    description: getSwaggerText("phs", "DESP_PH_NAME", lang),
  })
  @IsString()
  @IsNotEmpty({ message: getSwaggerText("phs", "MSG_PH_NAME", lang) })
  name: string;

  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_TAX", lang),
    description: getSwaggerText("phs", "DESP_PH_TAX", lang),
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: getSwaggerText("phs", "MSG_RQD_PH_TAX", lang) })
  tax_id: string;

  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_ADDRESS", lang),
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_PHONE_NUMBER", lang),
    required: false,
  })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_EMAIL", lang),
    required: false,
  })
  @IsEmail({}, { message: getSwaggerText("phs", "DESP_PH_EMAIL", lang) })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_LOGO_URL", lang),
    required: false,
    description: getSwaggerText("phs", "DESP_PH_LOGO_URL", lang),
  })
  @IsUrl(
    {},
    { message: getSwaggerText("phs", "NO_VALID_PH_LOGO_URL", lang) }
  )
  @IsOptional()
  logo_url?: string;

  @ApiProperty({
    example: getSwaggerText("phs", "EXAMPLE_PH_LEGAL_REPRESENTATIVE", lang),
    description: getSwaggerText(
      "phs",
      "DESP_PH_LEGAL_REPRESENTATIVE",
      lang
    ),
    required: false,
  })
  @IsString()
  @IsOptional()
  legal_representative?: string;

  @ApiProperty({
    example: true,
    description: getSwaggerText("phs", "DESP_PH_ACTIVE", lang),
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: getSwaggerText("phs", "DESP_PH_CREATED_BY", lang),
  })
  @IsUUID("4", {
    message: getSwaggerText("phs", "VALID_PH_CREATED_BY", lang),
  })
  @IsNotEmpty()
  created_by: string;
}
