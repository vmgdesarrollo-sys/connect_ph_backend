import { ApiProperty } from '@nestjs/swagger';

import { I18nContext } from 'nestjs-i18n';
import {getSwaggerText} from "../../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

class PhDataDto {
  @ApiProperty({ example: 'uuid-123-456' })
  id: string;

  @ApiProperty({ example: 'Conjunto Residencial Los Álamos' })
  name: string;

  @ApiProperty({ example: '900123456-1', description: 'NIT o Identificación tributaria' })
  tax_id: string;

  @ApiProperty({ example: 'Calle 123 # 45-67, Bogotá' })
  address?: string;

  @ApiProperty({ example: '+576012345678' })
  phone_number?: string;

  @ApiProperty({ example: 'administracion@alamos.com' })
  email?: string;

  @ApiProperty({ 
    example: 'https://storage.googleapis.com/tu-bucket/logos/logo.png'
  })
  logo_url?: string;

  @ApiProperty({ example: 'Carlos Mario Restrepo' })
  legal_representative?: string;

  @ApiProperty({ example: true })
  is_active?: boolean;

  @ApiProperty({ example: '2025-12-25T13:45:00Z' })
  created_at: Date;
}

export class CreatePhResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Copropiedad creada exitosamente' })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class GetPhResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Detalle de la copropiedad' })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class UpdatePhResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Copropiedad actualizada exitosamente' })
  message: string;

  @ApiProperty({ type: PhDataDto })
  data: PhDataDto;
}

export class CreatePhResponseErrorDto {
  @ApiProperty({ example: 'Datos informados son invalidos.' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class CreatePhResponseErrorTaxIdDto {
  @ApiProperty({ example: 'tax_id (NIT) ya existe.' })
  message: string;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: 409 })
  statusCode: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total_items: number;

  @ApiProperty({ example: 10 })
  items_per_page: number;

  @ApiProperty({ example: 1 })
  current_page: number;

  @ApiProperty({ example: 10 })
  total_pages: number;

  @ApiProperty({ example: '2025-12-29T21:15:00Z' })
  timestamp: string;
}

export class PhsListResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Listado de copropiedades obtenido correctamente' })
  message: string;

  @ApiProperty({ type: [PhDataDto] }) // El corchete [PhDto] indica que es un array
  data: PhDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  properties: PaginationMetaDto;
}

export class DeletePhResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Copropiedad eliminada exitosamente' })
  message: string;
}