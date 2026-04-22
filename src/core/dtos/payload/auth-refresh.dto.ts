import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from '../../../utils/swagger-i18n.loader';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('auth', key, lang);

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: t('REFRESH_TOKEN_DESC') })
  @IsString()
  @IsNotEmpty({ message: t('REFRESH_TOKEN_REQ') })
  refresh_token: string;
}
