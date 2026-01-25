import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('assembly_announcements', key, lang);

export class CreateAnnouncementDto {
  @ApiProperty({ description: t('ASSEMBLY_ID_DESC'), example: t('UUID') })
  @IsUUID() @IsNotEmpty()
  assemblies_id: string;

  @ApiProperty({ description: t('TITLE_DESC'), example: t('TITLE') })
  @IsString() @IsNotEmpty()
  title: string;

  @ApiProperty({ description: t('MESSAGE_DESC'), example: t('MESSAGE') })
  @IsString() @IsNotEmpty()
  message: string;

  @ApiProperty({ description: t('TYPE_DESC'), example: t('TYPE'), required: false })
  @IsString() @IsOptional()
  type?: string;

  @ApiProperty({ description: t('IS_STICKY_DESC'), example: false, required: false })
  @IsBoolean() @IsOptional()
  is_sticky?: boolean;
}