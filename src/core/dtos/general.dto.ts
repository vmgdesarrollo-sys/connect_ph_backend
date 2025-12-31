import { ApiProperty } from '@nestjs/swagger';
// import { } from 'class-validator';

export class AuthErrorDto {
  @ApiProperty({ example: 'Token no proporcionado o formato inválido' })
  message: string;

  @ApiProperty({ example: "Unauthorized" })
  error: string;

  @ApiProperty({ example: 403 })
  statusCode: number;
}
