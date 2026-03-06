import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from '../../../utils/swagger-i18n.loader';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('user_roles_phs', key, lang);

export class CreateUserRolePhDto {
  @ApiProperty({
    example: ["550e8400-e29b-41d4-a716-446655440000"],
    description: t('PHS_IDS_DESC')
  })
  @IsArray()
  @ArrayNotEmpty({ message: t('PHS_IDS_REQ') })
  @IsUUID('4', { each: true })
  phs_ids: string[];
}
