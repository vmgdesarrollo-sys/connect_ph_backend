import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('_assembly_attendances', key, lang);

export class CreateAttendanceDto {
  @ApiProperty({ description: t('ASSEMBLY_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  assemblies_id: string;

  @ApiProperty({ description: t('UNIT_ASSIGNMENT_ID_DESC') })
  @IsUUID() @IsNotEmpty()
  unit_assignments_id: string;

  @ApiProperty({ required: false })
  @IsDateString() @IsOptional()
  arrival_at?: Date;

  @ApiProperty({ required: false })
  @IsBoolean() @IsOptional()
  is_present?: boolean;

  @ApiProperty({ required: false })
  @IsUUID() @IsOptional()
  proxy_file_id?: string;

  @ApiProperty({ required: false, example: t('NOTES') })
  @IsString() @IsOptional()
  notes?: string;
}