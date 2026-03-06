import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ description: 'Token de acceso JWT' })
  accessToken: string;

  @ApiProperty({ description: 'URL del servidor LiveKit' })
  url: string;

  @ApiProperty({ description: 'Nombre de la sala' })
  roomName: string;
}

export class RoomResponseDto {
  @ApiProperty({ description: 'Nombre de la sala' })
  name: string;

  @ApiProperty({ description: 'Número de participantes' })
  numParticipants: number;

  @ApiProperty({ description: 'Tiempo de creación' })
  creationTime: string;

  @ApiProperty({ description: 'Metadatos', required: false })
  metadata?: string;
}

export class ParticipantResponseDto {
  @ApiProperty({ description: 'Identidad del participante' })
  identity: string;

  @ApiProperty({ description: 'Nombre del participante' })
  name: string;

  @ApiProperty({ description: 'Estado de conexión' })
  state: string;

  @ApiProperty({ description: 'Si puede publicar' })
  canPublish: boolean;

  @ApiProperty({ description: 'Metadatos', required: false })
  metadata?: string;
}

export class ParticipantsListResponseDto {
  @ApiProperty({ description: 'Nombre de la sala' })
  roomName: string;

  @ApiProperty({ description: 'Lista de participantes', type: [ParticipantResponseDto] })
  participants: ParticipantResponseDto[];

  @ApiProperty({ description: 'Total de participantes' })
  total: number;
}

export class WebhookEventResponseDto {
  @ApiProperty({ description: 'Tipo de evento' })
  event: string;

  @ApiProperty({ description: 'Room name' })
  room: string;

  @ApiProperty({ description: 'Participant identity', required: false })
  participant?: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}
