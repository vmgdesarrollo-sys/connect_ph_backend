import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsBoolean,
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUrl, 
  IsUUID 
} from 'class-validator';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

export class CreatePhDto {
  @ApiProperty({ example: 'Conjunto Residencial Los Álamos', description: 'Nombre oficial de la copropiedad' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la PH es obligatorio' })
  name: string;

  @ApiProperty({ example: '900123456-1', description: 'NIT o Identificación tributaria', required: true })
  @IsString()
  @IsNotEmpty({ message: 'El tax_id (NIT) es obligatorio' })
  tax_id: string;

  @ApiProperty({ example: 'Calle 123 # 45-67, Bogotá', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '+576012345678', required: false })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'administracion@alamos.com', required: false })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    example: 'https://storage.googleapis.com/tu-bucket/logos/logo.png', 
    required: false,
    description: 'URL del logo almacenado en Cloud Storage'
  })
  @IsUrl({}, { message: 'La URL del logo no es válida' })
  @IsOptional()
  logo_url?: string;

  @ApiProperty({ example: 'Carlos Mario Restrepo', description: 'Nombre del representante legal', required: false })
  @IsString()
  @IsOptional()
  legal_representative?: string;

  @ApiProperty({ example: true, description: 'Activación o inactivación del registro.', required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ 
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', 
    description: 'ID del usuario que registra la PH' 
  })
  @IsUUID('4', { message: 'El ID del creador debe ser un UUID válido' })
  @IsNotEmpty()
  created_by: string;
}