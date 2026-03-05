import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class GenerateTokenDto {
  @ApiProperty({ description: 'Nombre de la sala de LiveKit' })
  @IsString()
  roomName: string;

  @ApiProperty({ description: 'Identidad del usuario (username o ID)' })
  @IsString()
  identity: string;

  @ApiPropertyOptional({ description: 'Nombre a mostrar del usuario' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Tipo de rol del usuario', enum: ['ADMIN', 'HOST', 'VIEWER', 'SPEAKER'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Si puede publicar audio/video' })
  @IsOptional()
  @IsBoolean()
  canPublish?: boolean;
}

export class CreateRoomDto {
  @ApiProperty({ description: 'Nombre de la sala' })
  @IsString()
  roomName: string;

  @ApiPropertyOptional({ description: 'Número máximo de participantes' })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'Tiempo en segundos antes de cerrar sala vacía' })
  @IsOptional()
  @IsNumber()
  emptyTimeout?: number;

  @ApiPropertyOptional({ description: 'Metadatos adicionales de la sala' })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class UpdateParticipantDto {
  @ApiProperty({ description: 'Identidad del participante' })
  @IsString()
  identity: string;

  @ApiProperty({ description: 'Nombre de la sala' })
  @IsString()
  roomName: string;

  @ApiPropertyOptional({ description: 'Si puede publicar audio/video' })
  @IsOptional()
  @IsBoolean()
  canPublish?: boolean;

  @ApiPropertyOptional({ description: 'Metadatos del participante' })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class KickParticipantDto {
  @ApiProperty({ description: 'Identidad del participante a expulsar' })
  @IsString()
  identity: string;

  @ApiProperty({ description: 'Nombre de la sala' })
  @IsString()
  roomName: string;
}

export class MuteParticipantDto {
  @ApiProperty({ description: 'Identidad del participante' })
  @IsString()
  identity: string;

  @ApiProperty({ description: 'Nombre de la sala' })
  @IsString()
  roomName: string;

  @ApiProperty({ description: 'Silenciar (true) o habilitar (false)' })
  @IsBoolean()
  muted: boolean;
}

export class RoomInfoDto {
  @ApiProperty({ description: 'Nombre de la sala' })
  @IsString()
  roomName: string;
}

export class EndRoomDto {
  @ApiProperty({ description: 'Nombre de la sala a finalizar' })
  @IsString()
  roomName: string;
}
