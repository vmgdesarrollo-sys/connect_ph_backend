import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from "../../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText('users', key, lang);

export class CreateUserDto {
  
  @ApiProperty({ example: t('FIRST_NAME'), description: t('FIRST_NAME_DESC'), required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ example: t('LAST_NAME'), description: t('LAST_NAME_DESC'), required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: "Natural", description: t('TYPE_DESC') })
  @IsString()
  @IsNotEmpty()
  type_person: string;

  @ApiProperty({ example: "M", description: t('GENDER_DESC') })
  @IsString()
  gender: string;

  @ApiProperty({ example: t('AVATAR'), description: t('AVATAR_DESC') })
  @IsString()
  @IsOptional()
  avatar_url: string;

  @ApiProperty({ example: t('EMAIL'), description: t('EMAIL_DESC'), required: false })
  @IsEmail({}, { message: t('EMAIL_INVALID') })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: t('PASSWORD'), description: t('PASSWORD_DESC'), required: false })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: t('PASSWORD_MIN') })
  password?: string;

  @ApiProperty({ example: "CC", description: t('DOC_TYPE_DESC'), required: false })
  @IsOptional()
  document_type?: string;

  @ApiProperty({ example: t('DOC_NUM'), description: t('DOC_NUM_DESC'), required: false })
  @IsOptional()
  document_number?: string;

  @ApiProperty({ example: t('PHONE'), description: t('PHONE_DESC'), required: false })
  @IsOptional()
  phone_number?: string;
}