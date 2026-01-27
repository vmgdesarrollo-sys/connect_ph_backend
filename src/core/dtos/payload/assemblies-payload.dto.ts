import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('assemblies', key, lang);

export class CreateAssemblyDto {
  @ApiProperty({ description: t('PHS_ID_DESC'), example: t('UUID') })
  @IsUUID() @IsNotEmpty()
  phs_id: string;

  @ApiProperty({ description: t('NAME_DESC'), example: t('NAME') })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ description: t('DESCRIPTION_DESC'), example: t('DESCRIPTION'), required: false })
  @IsString() @IsOptional()
  description?: string;

  @ApiProperty({ description: t('TYPE_DESC'), example: t('TYPE') })
  @IsString() @IsNotEmpty()
  type: string;

  @ApiProperty({ description: t('STATUS_DESC'), example: t('STATUS'), required: false })
  @IsString() @IsOptional()
  status?: string;

  @ApiProperty({ description: t('SCHEDULED_AT_DESC'), example: t('SCHEDULED') })
  @IsDateString() @IsNotEmpty()
  scheduled_at: Date;

  @ApiProperty({ description: t('STARTED_AT_DESC'), required: false })
  @IsDateString() @IsOptional()
  started_at?: Date;

  @ApiProperty({ description: t('FINISHED_AT_DESC'), required: false })
  @IsDateString() @IsOptional()
  finished_at?: Date;

  @ApiProperty({ description: t('LIVEKIT_DESC'), example: t('LIVEKIT'), required: false })
  @IsString() @IsOptional()
  livekit_room_name?: string;

  @ApiProperty({ description: t('QUORUM_REQ_DESC'), example: t('QUORUM') })
  @IsNumber() @IsOptional()
  quorum_requirement: number;

  @ApiProperty({ description: t('IS_ACTIVE_DESC'), example: true, required: false })
  @IsBoolean() @IsOptional()
  is_active?: boolean;
}