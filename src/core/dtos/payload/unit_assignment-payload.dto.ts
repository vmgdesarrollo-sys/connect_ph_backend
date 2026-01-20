import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('user_roles', key, lang);

export class CreateUserRolDto {
  
  @ApiProperty({ example: ["admin", "supervisor"], description: t('ROLES_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('ROLES_REQ') })
  roles: string[];

}