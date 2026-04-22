import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('user_roles', key, lang);

export class CreateUserRolDto {
  
  @ApiProperty({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: t('ROLES_DESC') })
  @IsNotEmpty({ message: t('ROLES_REQ') })
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un UUID válido' })
  roles: string[];

}