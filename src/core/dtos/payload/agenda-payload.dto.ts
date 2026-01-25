import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsBoolean, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('agenda', `${key}`, lang);

export class CreateAgendaDto {
  @ApiProperty({ description: t('ASSEMBLY_ID_DESC'), example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  assembly_id: string;

  @ApiProperty({ description: t('SORT_ORDER_DESC'), example: 1 })
  @IsInt()
  @IsOptional()
  sort_order: number;

  @ApiProperty({ description: t('TITLE_DESC'), example: t('TITLE_2') })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: t('DESCRIPTION_DESC'), example: t('DESCRIPTION'), required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: t('IS_VOTABLE_DESC'), example: true })
  @IsBoolean()
  @IsOptional()
  is_votable: boolean;

  @ApiProperty({ description: t('QUORUM_DESC'), example: t('QUORUM') })
  @IsNumber()
  @IsOptional()
  required_quorum: number;
}