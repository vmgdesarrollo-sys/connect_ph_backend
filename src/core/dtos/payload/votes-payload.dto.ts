import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsString, IsNumber } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('votes', key, lang);

export class CreateVoteDto {
  @ApiProperty({ description: t('QUESTION_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  voting_questions_id: string;

  @ApiProperty({ description: t('OPTION_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  questions_options_id: string;

  @ApiProperty({ description: t('ATTENDANCE_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  assembly_attendances_id: string;

  @ApiProperty({ description: t('COEFFICIENT_DESC') })
  @IsNumber() @IsNotEmpty()
  coefficient_at_voting: number;

  @ApiProperty({ description: t('IP_DESC'), required: false })
  @IsString() @IsOptional()
  ip_address?: string;

  @ApiProperty({ description: t('AGENT_DESC'), required: false })
  @IsString() @IsOptional()
  user_agent?: string;
}