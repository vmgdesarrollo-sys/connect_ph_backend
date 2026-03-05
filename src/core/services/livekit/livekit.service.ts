import { Injectable, Logger } from '@nestjs/common';
import { AccessToken, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';
import type { ParticipantInfo, Room } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;
  private webhookReceiver: WebhookReceiver;

  constructor() {
    const livekitUrl = process.env.LIVEKIT_URL || '';
    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';

    if (!livekitUrl || !apiKey || !apiSecret) {
      this.logger.warn('LiveKit credentials not fully configured');
    }

    this.roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    this.webhookReceiver = new WebhookReceiver(apiKey, apiSecret);
  }

  /**
   * Genera un token con permisos de publicación (cámara/micro)
   */
  async generateToken(
    roomName: string,
    identity: string,
    name?: string,
    canPublish: boolean = false,
    canSubscribe: boolean = true,
    canPublishData: boolean = true,
  ): Promise<string> {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        name: name || identity,
        ttl: process.env.LIVEKIT_TTL || '8h',
      },
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe,
      canPublish,
      canPublishData,
      canUpdateOwnMetadata: true,
    });

    return at.toJwt();
  }

  /**
   * Genera token de viewer (solo puede ver, no publicar)
   */
  async generateViewerToken(roomName: string, identity: string, name?: string): Promise<string> {
    return this.generateToken(roomName, identity, name, false, true, false);
  }

  /**
   * Genera token de host/admin (puede publicar y administrar)
   */
  async generateHostToken(roomName: string, identity: string, name?: string): Promise<string> {
    return this.generateToken(roomName, identity, name, true, true, true);
  }

  /**
   * Permite cambiar permisos en caliente (ej. dar la palabra a alguien)
   */
  async updateParticipantPermissions(
    roomName: string,
    identity: string,
    canPublish: boolean,
  ): Promise<void> {
    await this.roomService.updateParticipant(roomName, identity, {
      permission: {
        canPublish,
        canSubscribe: true,
        canPublishData: true,
        canUpdateMetadata: true,
      },
    });
    this.logger.log(`Updated permissions for ${identity} in room ${roomName}`);
  }

  /**
   * Lista participantes activos en una sala
   */
  async listActiveParticipants(roomName: string): Promise<ParticipantInfo[]> {
    try {
      return await this.roomService.listParticipants(roomName);
    } catch (error) {
      this.logger.error(`Error listing participants in room ${roomName}`, error);
      return [];
    }
  }

  /**
   * Obtiene información de una sala específica
   */
  async getRoomInfo(roomName: string): Promise<Room | null> {
    try {
      const rooms = await this.roomService.listRooms();
      return rooms.find((room) => room.name === roomName) || null;
    } catch (error) {
      this.logger.error(`Error getting room info for ${roomName}`, error);
      return null;
    }
  }

  /**
   * Lista todas las salas activas
   */
  async listActiveRooms(): Promise<Room[]> {
    try {
      return await this.roomService.listRooms();
    } catch (error) {
      this.logger.error('Error listing rooms', error);
      return [];
    }
  }

  /**
   * Crea una nueva sala con configuración específica
   */
  async createRoom(
    roomName: string,
    options?: {
      maxParticipants?: number;
      emptyTimeout?: number;
      metadata?: string;
    },
  ): Promise<Room> {
    const room = await this.roomService.createRoom({
      name: roomName,
      maxParticipants: options?.maxParticipants || 100,
      emptyTimeout: options?.emptyTimeout || 300, // 5 minutos
      metadata: options?.metadata,
    });
    this.logger.log(`Room ${roomName} created successfully`);
    return room;
  }

  /**
   * Elimina una sala específica
   */
  async deleteRoom(roomName: string): Promise<void> {
    await this.roomService.deleteRoom(roomName);
    this.logger.log(`Room ${roomName} deleted successfully`);
  }

  /**
   * Expulsa a un participante de la sala
   */
  async kickParticipant(roomName: string, identity: string): Promise<void> {
    await this.roomService.removeParticipant(roomName, identity);
    this.logger.log(`Participant ${identity} kicked from room ${roomName}`);
  }

  /**
   * Silencia/desilencia el audio de un participante
   * Nota: LiveKit maneja esto a nivel de track
   */
  async muteParticipantAudio(roomName: string, identity: string, muted: boolean): Promise<void> {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, '', muted);
      this.logger.log(`Participant ${identity} audio ${muted ? 'muted' : 'unmuted'} in room ${roomName}`);
    } catch (error) {
      this.logger.warn(`Could not mute/unmute participant ${identity}`, error);
    }
  }

  /**
   * Actualiza metadatos de un participante
   */
  async updateParticipantMetadata(
    roomName: string,
    identity: string,
    metadata: string,
  ): Promise<void> {
    await this.roomService.updateParticipant(roomName, identity, { metadata });
    this.logger.log(`Updated metadata for ${identity} in room ${roomName}`);
  }

  /**
   * Obtiene información de un participante específico
   */
  async getParticipant(
    roomName: string,
    identity: string,
  ): Promise<ParticipantInfo | null> {
    try {
      return await this.roomService.getParticipant(roomName, identity);
    } catch (error) {
      this.logger.error(`Error getting participant ${identity} in room ${roomName}`, error);
      return null;
    }
  }

  /**
   * Procesa un webhook de LiveKit
   */
  async processWebhook(body: string | object, authHeader: string): Promise<any> {
    try {
      const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
      const event = await this.webhookReceiver.receive(rawBody, authHeader);
      this.logger.log(`Webhook event received: ${event.event}`);
      return event;
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      throw error;
    }
  }

  /**
   * Finaliza una sala (expulsa a todos los participantes)
   */
  async endRoom(roomName: string): Promise<void> {
    const participants = await this.listActiveParticipants(roomName);
    
    // Expulsar a todos los participantes
    for (const participant of participants) {
      try {
        await this.kickParticipant(roomName, participant.identity);
      } catch (error) {
        this.logger.warn(`Error kicking participant ${participant.identity}`, error);
      }
    }
    
    // Eliminar la sala
    await this.deleteRoom(roomName);
    this.logger.log(`Room ${roomName} ended successfully`);
  }
}
