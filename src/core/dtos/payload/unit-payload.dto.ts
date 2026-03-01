import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('units', key, lang);

export class CreateUnitDto {

  @ApiProperty({ example: t('BOLCK_EXAM'), description: t('BLOCK_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('BLOCK_REQ') })
  block: string;

  @ApiProperty({ example: t("UNIT_NUMBER_EXAM"), description: t('UNIT_NUMBER_DESC') })
  @IsString()
  @IsNotEmpty()
  unit_number: string;

  @ApiProperty({ example: t("TYPE_EXAM"), description: t('TYPE_DESC') })
  @IsString()
  type: string;

  @ApiProperty({ example: t('COEFFICIENT_EXAM'), description: t('COEFFICIENT_DESC') })
  @IsNumber()
  @IsOptional()
  coefficient?: number;

  @ApiProperty({ example: t('FLOOR_EXAM'), description: t('FLOOR_DESC'), required: true })
  @IsNumber()
  @IsNotEmpty()
  floor: number;

  @ApiProperty({ example: t("AREA_EXAM"), description: t('AREA_DESC'), required: false })
  @IsNumber()
  @IsOptional()
  area?: number;

  @ApiProperty({ example: t('TAX_RESPONSABLE_EXAM'), description: t('TAX_RESPONSABLE_DESC'), required: false })
  @IsOptional()
  tax_responsible?: string;

  @ApiProperty({ example: t('TAX_RESPONSABLE_DOC_TYPE_EXAM'), description: t('TAX_RESPONSABLE_DOC_TYPE_DESC'), required: false })
  @IsOptional()
  tax_responsible_document_type?: string;

  @ApiProperty({ example: t('TAX_RESPONSABLE_DOC_EXAM'), description: t('TAX_RESPONSABLE_DOC_DESC'), required: false })
  @IsOptional()
  tax_responsible_document?: string;
  
}