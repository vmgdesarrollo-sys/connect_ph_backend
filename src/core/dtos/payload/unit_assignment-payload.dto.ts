import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('unit_assignments', key, lang);

export class CreateAssingmentUnitDto {
  
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: t('UNIT_ID_DESC') })
  @IsUUID()
  @IsNotEmpty({ message: t('UNIT_ID_REQ') })
  units_id: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440001", description: t('USER_ROLE_ID_DESC') })
  @IsUUID()
  @IsNotEmpty({ message: t('USER_ROLE_ID_REQ') })
  user_roles_id: string;

  @ApiProperty({ example: true, description: t('IS_MAIN_RESIDENT_DESC'), required: false })
  @IsBoolean()
  @IsOptional()
  is_main_resident?: boolean;

  @ApiProperty({ example: true, description: t('CAN_VOTE_DESC'), required: false })
  @IsBoolean()
  @IsOptional()
  can_vote?: boolean;

}