import { LiveKitService } from '../../services/livekit/livekit.service';
import { AuthGuard } from "../../utils/auth.guard";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Res,
  Headers,
  HttpStatus,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  GenerateTokenDto,
  CreateRoomDto,
  UpdateParticipantDto,
  KickParticipantDto,
  MuteParticipantDto,
  RoomInfoDto,
  EndRoomDto,
} from '../../dtos/payload/livekit-payload.dto';

@ApiTags('Video')
@UseGuards(AuthGuard)
@ApiBearerAuth("access-token")
@Controller('video')
export class VideoController {
  constructor(private readonly livekitService: LiveKitService) {}

  /**
   * Endpoint para generar token de acceso a una sala
   */
  @Post('token')
  @ApiOperation({ summary: 'Generar token de acceso a sala de video' })
  @ApiResponse({ status: 200, description: 'Token generado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBody({ type: GenerateTokenDto })
  async getToken(
    @Body() data: GenerateTokenDto,
    @Res() res: Response,
  ) {
    try {
      // Determinar permisos según el rol
      let canPublish = data.canPublish || false;
      
      if (data.role === 'ADMIN' || data.role === 'HOST') {
        canPublish = true;
      }

      const token = await this.livekitService.generateToken(
        data.roomName,
        data.identity,
        data.name,
        canPublish,
      );

      const livekitUrl = process.env.LIVEKIT_URL || '';

      return res.status(HttpStatus.OK).json({
        accessToken: token,
        url: livekitUrl,
        roomName: data.roomName,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar token',
        error: error.message,
      });
    }
  }

  /**
   * Generar token de viewer (solo ver)
   */
  @Post('token/viewer')
  @ApiOperation({ summary: 'Generar token de viewer (solo puede ver)' })
  @ApiResponse({ status: 200, description: 'Token de viewer generado' })
  async getViewerToken(
    @Body() data: GenerateTokenDto,
    @Res() res: Response,
  ) {
    try {
      const token = await this.livekitService.generateViewerToken(
        data.roomName,
        data.identity,
        data.name,
      );

      const livekitUrl = process.env.LIVEKIT_URL || '';

      return res.status(HttpStatus.OK).json({
        accessToken: token,
        url: livekitUrl,
        roomName: data.roomName,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar token de viewer',
        error: error.message,
      });
    }
  }

  /**
   * Generar token de host (puede publicar)
   */
  @Post('token/host')
  @ApiOperation({ summary: 'Generar token de host (puede publicar)' })
  @ApiResponse({ status: 200, description: 'Token de host generado' })
  async getHostToken(
    @Body() data: GenerateTokenDto,
    @Res() res: Response,
  ) {
    try {
      const token = await this.livekitService.generateHostToken(
        data.roomName,
        data.identity,
        data.name,
      );

      const livekitUrl = process.env.LIVEKIT_URL || '';

      return res.status(HttpStatus.OK).json({
        accessToken: token,
        url: livekitUrl,
        roomName: data.roomName,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar token de host',
        error: error.message,
      });
    }
  }

  /**
   * Crear una nueva sala
   */
  @Post('room')
  @ApiOperation({ summary: 'Crear una nueva sala de video' })
  @ApiResponse({ status: 201, description: 'Sala creada exitosamente' })
  @ApiBody({ type: CreateRoomDto })
  async createRoom(
    @Body() data: CreateRoomDto,
    @Res() res: Response,
  ) {
    try {
      const room = await this.livekitService.createRoom(data.roomName, {
        maxParticipants: data.maxParticipants,
        emptyTimeout: data.emptyTimeout,
        metadata: data.metadata,
      });

      const creationTime = Number(room.creationTime) * 1000;

      return res.status(HttpStatus.CREATED).json({
        name: room.name,
        numParticipants: room.numParticipants,
        creationTime: new Date(creationTime).toISOString(),
        metadata: room.metadata,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al crear la sala',
        error: error.message,
      });
    }
  }

  /**
   * Listar salas activas
   */
  @Get('rooms')
  @ApiOperation({ summary: 'Listar todas las salas activas' })
  @ApiResponse({ status: 200, description: 'Lista de salas' })
  async listRooms(@Res() res: Response) {
    try {
      const rooms = await this.livekitService.listActiveRooms();

      return res.status(HttpStatus.OK).json({
        rooms: rooms.map((room) => ({
          name: room.name,
          numParticipants: room.numParticipants,
          creationTime: new Date(Number(room.creationTime) * 1000).toISOString(),
          metadata: room.metadata,
        })),
        total: rooms.length,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al listar salas',
        error: error.message,
      });
    }
  }

  /**
   * Obtener información de una sala
   */
  @Get('room/:roomName')
  @ApiOperation({ summary: 'Obtener información de una sala' })
  @ApiParam({ name: 'roomName', description: 'Nombre de la sala' })
  @ApiResponse({ status: 200, description: 'Información de la sala' })
  async getRoomInfo(
    @Param('roomName') roomName: string,
    @Res() res: Response,
  ) {
    try {
      const room = await this.livekitService.getRoomInfo(roomName);

      if (!room) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Sala no encontrada',
        });
      }

      const creationTime = Number(room.creationTime) * 1000;

      return res.status(HttpStatus.OK).json({
        name: room.name,
        numParticipants: room.numParticipants,
        creationTime: new Date(creationTime).toISOString(),
        metadata: room.metadata,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al obtener información de la sala',
        error: error.message,
      });
    }
  }

  /**
   * Eliminar una sala
   */
  @Delete('room/:roomName')
  @ApiOperation({ summary: 'Eliminar una sala' })
  @ApiParam({ name: 'roomName', description: 'Nombre de la sala' })
  @ApiResponse({ status: 200, description: 'Sala eliminada' })
  async deleteRoom(
    @Param('roomName') roomName: string,
    @Res() res: Response,
  ) {
    try {
      await this.livekitService.deleteRoom(roomName);

      return res.status(HttpStatus.OK).json({
        message: `Sala ${roomName} eliminada exitosamente`,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al eliminar la sala',
        error: error.message,
      });
    }
  }

  /**
   * Finalizar una sala (expulsar participantes y eliminar)
   */
  @Post('room/end')
  @ApiOperation({ summary: 'Finalizar una sala (expulsar participantes y eliminar)' })
  @ApiBody({ type: EndRoomDto })
  @ApiResponse({ status: 200, description: 'Sala finalizada' })
  async endRoom(
    @Body() data: EndRoomDto,
    @Res() res: Response,
  ) {
    try {
      await this.livekitService.endRoom(data.roomName);

      return res.status(HttpStatus.OK).json({
        message: `Sala ${data.roomName} finalizada exitosamente`,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al finalizar la sala',
        error: error.message,
      });
    }
  }

  /**
   * Listar participantes de una sala
   */
  @Get('room/:roomName/participants')
  @ApiOperation({ summary: 'Listar participantes de una sala' })
  @ApiParam({ name: 'roomName', description: 'Nombre de la sala' })
  @ApiResponse({ status: 200, description: 'Lista de participantes' })
  async listParticipants(
    @Param('roomName') roomName: string,
    @Res() res: Response,
  ) {
    try {
      const participants = await this.livekitService.listActiveParticipants(roomName);

      return res.status(HttpStatus.OK).json({
        roomName,
        participants: participants.map((p) => ({
          identity: p.identity,
          name: p.name,
          state: p.state,
          canPublish: true, // Esta info viene en el grant, no en participant info
          metadata: p.metadata,
        })),
        total: participants.length,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al listar participantes',
        error: error.message,
      });
    }
  }

  /**
   * Expulsar a un participante
   */
  @Post('participant/kick')
  @ApiOperation({ summary: 'Expulsar a un participante de la sala' })
  @ApiBody({ type: KickParticipantDto })
  @ApiResponse({ status: 200, description: 'Participante expulsado' })
  async kickParticipant(
    @Body() data: KickParticipantDto,
    @Res() res: Response,
  ) {
    try {
      await this.livekitService.kickParticipant(data.roomName, data.identity);

      return res.status(HttpStatus.OK).json({
        message: `Participante ${data.identity} expulsado de ${data.roomName}`,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al expulsar participante',
        error: error.message,
      });
    }
  }

  /**
   * Silenciar/Activar audio de un participante
   */
  @Post('participant/mute')
  @ApiOperation({ summary: 'Silenciar o activar audio de un participante' })
  @ApiBody({ type: MuteParticipantDto })
  @ApiResponse({ status: 200, description: 'Audio actualizado' })
  async muteParticipant(
    @Body() data: MuteParticipantDto,
    @Res() res: Response,
  ) {
    try {
      await this.livekitService.muteParticipantAudio(
        data.roomName,
        data.identity,
        data.muted,
      );

      return res.status(HttpStatus.OK).json({
        message: `Audio de ${data.identity} ${data.muted ? 'silenciado' : 'activado'}`,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al modificar audio',
        error: error.message,
      });
    }
  }

  /**
   * Actualizar permisos de un participante
   */
  @Post('participant/update')
  @ApiOperation({ summary: 'Actualizar permisos de un participante' })
  @ApiBody({ type: UpdateParticipantDto })
  @ApiResponse({ status: 200, description: 'Permisos actualizados' })
  async updateParticipant(
    @Body() data: UpdateParticipantDto,
    @Res() res: Response,
  ) {
    try {
      if (data.canPublish !== undefined) {
        await this.livekitService.updateParticipantPermissions(
          data.roomName,
          data.identity,
          data.canPublish,
        );
      }

      if (data.metadata) {
        await this.livekitService.updateParticipantMetadata(
          data.roomName,
          data.identity,
          data.metadata,
        );
      }

      return res.status(HttpStatus.OK).json({
        message: `Permisos de ${data.identity} actualizados en ${data.roomName}`,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al actualizar permisos',
        error: error.message,
      });
    }
  }

  /**
   * Endpoint para recibir webhooks de LiveKit
   */
  @Post('webhooks')
  @ApiOperation({ summary: 'Recibir eventos de LiveKit (Webhooks)' })
  @ApiResponse({ status: 200, description: 'Webhook procesado' })
  async handleWebhook(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const event = await this.livekitService.processWebhook(body, authHeader);
      const roomName = event.room?.name;
      const identity = event.participant?.identity;

      // Manejar diferentes tipos de eventos
      switch (event.event) {
        case 'participant_joined':
          // Aquí puedes guardar en DB: assembly_attendances
          console.log(`Participante joined: ${identity} en sala ${roomName}`);
          break;

        case 'participant_left':
          console.log(`Participante left: ${identity} de sala ${roomName}`);
          break;

        case 'room_started':
          console.log(`Sala iniciada: ${roomName}`);
          break;

        case 'room_ended':
          console.log(`Sala finalizada: ${roomName}`);
          break;

        case 'track_published':
          console.log(`Track publicado por: ${identity}`);
          break;

        case 'track_unpublished':
          console.log(`Track no publicado por: ${identity}`);
          break;

        default:
          console.log(`Otro evento: ${event.event}`);
      }

      return res.status(HttpStatus.OK).send('ok');
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid signature');
    }
  }
}
