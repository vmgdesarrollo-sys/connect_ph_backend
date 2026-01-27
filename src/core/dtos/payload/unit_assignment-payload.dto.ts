import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('unit_assignments', key, lang);

export class CreateAssingmentUnitDto {
  
  @ApiProperty({ example: [t("ID_EXAMPLE")], description: t('UNITS_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('UNITS_REQ') })
  units: string[];

}