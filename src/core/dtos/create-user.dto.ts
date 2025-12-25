import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan' })
  //@IsString()
  //@IsNotEmpty({ message: 'El nombre es obligatorio' })
  first_name: string;

  @ApiProperty({ example: 'Pérez' })
  //@IsString()
  //@IsNotEmpty({ message: 'El apellido es obligatorio' })
  last_name: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  //@IsEmail({}, { message: 'El correo electrónico no es válido' })
  //@IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  //@IsString()
  //@MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'CC', required: false })
  //@IsString()
  //@IsOptional()
  document_type?: string;

  @ApiProperty({ example: '12345678', required: false })
  //@IsString()
  //@IsOptional()
  document_number?: string;

  @ApiProperty({ example: '+573001234567', required: false })
  //@IsString()
  //@IsOptional()
  phone_number?: string;
}