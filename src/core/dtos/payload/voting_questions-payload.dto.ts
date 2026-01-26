import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsString, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('voting_questions', key, lang);

export class CreateVotingQuestionDto {
  @ApiProperty({ description: t('AGENDA_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  agenda_id: string;

  @ApiProperty({ description: t('QUESTION_TEXT_DESC'), example: t('QUESTION') })
  @IsString() @IsNotEmpty()
  question_text: string;

  @ApiProperty({ description: t('DESCRIPTION_DESC'), required: false })
  @IsString() @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Coeficiente' })
  @IsString() @IsOptional()
  type?: string;

  @ApiProperty({ example: 'Pendiente' })
  @IsString() @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Única' })
  @IsString() @IsOptional()
  result_type?: string;

  @ApiProperty({ default: 1 })
  @IsInt() @IsOptional()
  min_selections?: number;

  @ApiProperty({ default: 1 })
  @IsInt() @IsOptional()
  max_selections?: number;

  @ApiProperty({ required: false })
  @IsDateString() @IsOptional()
  opened_at?: Date;

  @ApiProperty({ required: false })
  @IsDateString() @IsOptional()
  closed_at?: Date;
}