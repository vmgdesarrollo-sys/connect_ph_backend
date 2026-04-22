import { ApiProperty } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from '../../../utils/swagger-i18n.loader';

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('user_roles_phs', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

class PhItemDto {
  @ApiProperty({ example: t('ID_EXAMPLE') })
  id: string;

  @ApiProperty({ example: t('PH_NAME_EXAMPLE') })
  name: string;
}

class UserRolePhsDataDto {
  @ApiProperty({ example: t('ID_EXAMPLE') })
  user_roles_id: string;

  @ApiProperty({ type: [PhItemDto] })
  phs: PhItemDto[];
}

export class CreateUserRolePhResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_CREATE') })
  message: string;

  @ApiProperty({ type: UserRolePhsDataDto })
  data: UserRolePhsDataDto;
}

export class CreateUserRolePhResponseErrorDto {
  @ApiProperty({ example: t('MSG_ERROR_DATA') })
  message: string;

  @ApiProperty({ example: g('BAD_REQUEST') })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class GetUserRolePhResponseDto {
  @ApiProperty({ example: g('SUCCESS') })
  status: string;

  @ApiProperty({ example: t('MSG_GET') })
  message: string;

  @ApiProperty({ type: UserRolePhsDataDto })
  data: UserRolePhsDataDto;
}
