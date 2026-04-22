import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from '../../../utils/swagger-i18n.loader';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('auth', key, lang);

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'usuario@correo.com', description: t('EMAIL_DESC') })
  @IsEmail({}, { message: t('EMAIL_INVALID') })
  @IsNotEmpty({ message: t('EMAIL_REQ') })
  email: string;
}
