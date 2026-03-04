import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from '../../../utils/swagger-i18n.loader';
import { Match } from '../../decorators/match.decorator';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('auth', key, lang);

export class SetPasswordDto {
  @ApiProperty({ example: 'token', description: t('PASSWORD_TOKEN_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('PASSWORD_TOKEN_REQ') })
  token: string;

  @ApiProperty({ example: 'MySecurePassword123', description: t('PASSWORD_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('PASSWORD_REQ') })
  @MinLength(8, { message: t('PASSWORD_MIN') })
  password: string;

  @ApiProperty({ example: 'MySecurePassword123', description: t('PASSWORD_CONFIRM_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('PASSWORD_CONFIRM_REQ') })
  @Match('password', { message: t('PASSWORD_MISMATCH') })
  confirm_password: string;
}
