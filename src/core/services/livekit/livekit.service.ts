import { Injectable, Logger } from "@nestjs/common";
import {
  AccessToken,
  RoomServiceClient,
  WebhookReceiver,
} from "livekit-server-sdk";
import type { ParticipantInfo, Room } from "livekit-server-sdk";

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;
  private webhookReceiver: WebhookReceiver;
  private readonly clusterEnabled: boolean;

  constructor() {
    const livekitUrl = process.env.LIVEKIT_URL || "";
    const apiKey = process.env.LIVEKIT_API_KEY || "";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "";

    this.clusterEnabled = !!(process.env.LIVEKIT_REDIS_HOST && livekitUrl);

    if (!livekitUrl || !apiKey || !apiSecret) {
      this.logger.warn("LiveKit credentials not fully configured");
    }

    // En modo clúster, LIVEKIT_URL debe apuntar al balanceador de carga (LB)
    // que distribuye entre nodos LiveKit. Cada nodo LiveKit debe tener
    // configurado Redis (Cloud Memorystore) para compartir estado.
    this.roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    this.webhookReceiver = new WebhookReceiver(apiKey, apiSecret);

    if (this.clusterEnabled) {
      this.logger.log("LiveKit CLUSTER mode:");
      this.logger.log(
        `  - Redis: ${process.env.LIVEKIT_REDIS_HOST}:${process.env.LIVEKIT_REDIS_PORT}`,
      );
      this.logger.log(
        `  - Max participants per room: ${process.env.LIVEKIT_MAX_PARTICIPANTS_PER_ROOM || "2000"}`,
      );
      this.logger.log(
        `  - Strategy: ${process.env.LIVEKIT_ROOM_STRATEGY || "selective_forwarding"}`,
      );
    } else {
      this.logger.log("LiveKit SINGLE-NODE mode (Redis not configured)");
    }
  }

  /**
   * Genera un token JWT para LiveKit.
   * IMPORTANTE para clúster: LIVEKIT_API_KEY y LIVEKIT_API_SECRET
   * deben ser idénticos en todos los nodos LiveKit y en este backend.
   */
  async generateToken(
    roomName: string,
    identity: string,
    name?: string,
    canPublish: boolean = false,
    canSubscribe: boolean = true,
    canPublishData: boolean = true,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        name: name || identity,
        ttl: process.env.LIVEKIT_TTL || "8h",
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    );

    // En clúster, el Node Selector de LiveKit usa el hash del roomName
    // para afiliar participantes al mismo nodo (o nodos interconnectados)
    const roomStrategy =
      process.env.LIVEKIT_ROOM_STRATEGY || "selective_forwarding";

    const grant: any = {
      roomJoin: true,
      room: roomName,
      canSubscribe,
      canPublish,
      canPublishData,
      canUpdateOwnMetadata: true,
    };

    // Para asambleas grandes (+2,000), usar selective forwarding:
    // - Solo quienes tienen la palabra (canPublish=true) envían video/audio
    // - Los demás (viewers) solo reciben (reduce carga CPU/GPU)
    if (roomStrategy === "selective_forwarding") {
      grant.canPublishSymphony = canPublish; // LiveKit v0.12+
    }

    at.addGrant(grant);

    this.logger.debug(
      `Token generated for ${identity} in room ${roomName} (publish: ${canPublish})`,
    );
    return at.toJwt();
  }

  async generateViewerToken(
    roomName: string,
    identity: string,
    name?: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    return this.generateToken(
      roomName,
      identity,
      name,
      false,
      true,
      false,
      metadata,
    );
  }

  async generateHostToken(
    roomName: string,
    identity: string,
    name?: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    return this.generateToken(
      roomName,
      identity,
      name,
      true,
      true,
      true,
      metadata,
    );
  }

  async createRoom(
    roomName: string,
    options?: {
      maxParticipants?: number;
      emptyTimeout?: number;
      metadata?: string;
      region?: string; // Para afinidad geográfica en clúster GCP
    },
  ): Promise<Room> {
    const maxParticipants =
      options?.maxParticipants ||
      parseInt(process.env.LIVEKIT_MAX_PARTICIPANTS_PER_ROOM || "2000", 10);
    const emptyTimeout = options?.emptyTimeout || 300; // 5 min cierre auto si vacía

    const roomConfig: any = {
      name: roomName,
      maxParticipants,
      emptyTimeout,
      metadata: options?.metadata,
      // En clúster, LiveKit asigna sala a nodo via hash(roomName)
      // 'nodeId' solo para debugging (no soportado en Cloud)
      ...(process.env.LIVEKIT_NODE_NAME && {
        nodeId: process.env.LIVEKIT_NODE_NAME,
      }),
    };

    const room = await this.roomService.createRoom(roomConfig);
    this.logger.log(
      `Room ${roomName} created (max: ${maxParticipants}, cluster: ${this.clusterEnabled})`,
    );
    return room;
  }

  async listActiveParticipants(roomName: string): Promise<ParticipantInfo[]> {
    try {
      return await this.roomService.listParticipants(roomName);
    } catch (error) {
      this.logger.error(
        `Error listing participants in room ${roomName}`,
        error,
      );
      return [];
    }
  }

  async getRoomInfo(roomName: string): Promise<Room | null> {
    try {
      const rooms = await this.roomService.listRooms();
      return rooms.find((room) => room.name === roomName) || null;
    } catch (error) {
      this.logger.error(`Error getting room info for ${roomName}`, error);
      return null;
    }
  }

  async listActiveRooms(): Promise<Room[]> {
    try {
      return await this.roomService.listRooms();
    } catch (error) {
      this.logger.error("Error listing rooms", error);
      return [];
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
      this.logger.log(`Room ${roomName} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting room ${roomName}`, error);
    }
  }

  async kickParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);
      this.logger.log(`Participant ${identity} kicked from room ${roomName}`);
    } catch (error) {
      this.logger.error(`Error kicking participant ${identity}`, error);
      throw error;
    }
  }

  async muteParticipantAudio(
    roomName: string,
    identity: string,
    muted: boolean,
  ): Promise<void> {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, "", muted);
      this.logger.log(
        `Participant ${identity} audio ${muted ? "muted" : "unmuted"} in room ${roomName}`,
      );
    } catch (error) {
      this.logger.warn(`Could not mute/unmute participant ${identity}`, error);
    }
  }

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
    this.logger.log(
      `Updated permissions for ${identity} in room ${roomName} (canPublish: ${canPublish})`,
    );
  }

  async updateParticipantMetadata(
    roomName: string,
    identity: string,
    metadata: string,
  ): Promise<void> {
    await this.roomService.updateParticipant(roomName, identity, { metadata });
    this.logger.log(`Updated metadata for ${identity} in room ${roomName}`);
  }

  async getParticipant(
    roomName: string,
    identity: string,
  ): Promise<ParticipantInfo | null> {
    try {
      return await this.roomService.getParticipant(roomName, identity);
    } catch (error) {
      this.logger.error(
        `Error getting participant ${identity} in room ${roomName}`,
        error,
      );
      return null;
    }
  }

  async processWebhook(
    body: string | object,
    authHeader: string,
  ): Promise<any> {
    try {
      const rawBody = typeof body === "string" ? body : JSON.stringify(body);
      const event = await this.webhookReceiver.receive(rawBody, authHeader);
      this.logger.log(`Webhook event received: ${event.event}`);
      return event;
    } catch (error) {
      this.logger.error("Error processing webhook", error);
      throw error;
    }
  }

  async endRoom(roomName: string): Promise<void> {
    try {
      const participants = await this.listActiveParticipants(roomName);
      this.logger.log(
        `Ending room ${roomName} with ${participants.length} participants`,
      );

      for (const participant of participants) {
        try {
          await this.kickParticipant(roomName, participant.identity);
        } catch (error) {
          this.logger.warn(
            `Error kicking participant ${participant.identity}`,
            error,
          );
        }
      }

      await this.deleteRoom(roomName);
      this.logger.log(
        `Room ${roomName} ended successfully (cluster: ${this.clusterEnabled})`,
      );
    } catch (error) {
      this.logger.error(`Error ending room ${roomName}`, error);
      throw error;
    }
  }

  /**
   * Método auxiliar: verifica si el clúster está habilitado
   */
  isClusterMode(): boolean {
    return this.clusterEnabled;
  }

  /**
   * Método auxiliar: obtiene configuración Redis
   */
  getRedisConfig() {
    return {
      host: process.env.LIVEKIT_REDIS_HOST,
      port: parseInt(process.env.LIVEKIT_REDIS_PORT || "6379", 10),
      password: process.env.LIVEKIT_REDIS_PASSWORD,
      prefix: process.env.LIVEKIT_REDIS_PREFIX || "livekit",
    };
  }
}
