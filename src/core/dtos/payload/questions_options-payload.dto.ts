import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsString, IsInt } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('questions_options', key, lang);

export class CreateQuestionOptionDto {
  @ApiProperty({ description: t('QUESTION_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  question_id: string;

  @ApiProperty({ description: t('OPTION_TEXT_DESC'), example: t('OPTION') })
  @IsString() @IsNotEmpty()
  option_text: string;

  @ApiProperty({ description: t('ORDER_INDEX_DESC'), example: t('ORDER') })
  @IsInt() @IsOptional()
  order_index?: number;

  @ApiProperty({ description: t('IS_ACTIVE_DESC'), default: true })
  @IsBoolean() @IsOptional()
  is_active?: boolean;
}