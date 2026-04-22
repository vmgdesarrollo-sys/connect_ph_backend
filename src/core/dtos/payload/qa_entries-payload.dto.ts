import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsString, IsInt } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('qa_entries', key, lang);

export class CreateQaEntryDto {
  @ApiProperty({ description: t('ATTENDANCE_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  assembly_attendances_id: string;

  @ApiProperty({ description: t('QUESTION_DESC'), example: t('QUESTION') })
  @IsString() @IsNotEmpty()
  question_text: string;

  @ApiProperty({ required: false })
  @IsBoolean() @IsOptional()
  is_private?: boolean;
}

export class UpdateQaEntryDto extends CreateQaEntryDto {
  @ApiProperty({ description: t('MODERATED_DESC'), required: false })
  @IsBoolean() @IsOptional()
  is_moderated?: boolean;

  @ApiProperty({ example: 'Aprobada', required: false })
  @IsString() @IsOptional()
  status?: string;

  @ApiProperty({ example: t('ANSWER'), required: false })
  @IsString() @IsOptional()
  answer_text?: string;

  @ApiProperty({ example: 5, required: false })
  @IsInt() @IsOptional()
  upvotes?: number;
}