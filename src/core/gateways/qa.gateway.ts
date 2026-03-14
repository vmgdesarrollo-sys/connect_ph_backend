import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

interface JoinRoomPayload {
  assemblyId: string;
  userId: string;
  role: 'participant' | 'moderator' | 'admin';
}

interface SendMessagePayload {
  assemblyId: string;
  userId: string;
  userName: string;
  questionText: string;
  isPrivate: boolean;
}

interface TypingPayload {
  assemblyId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface ModerateQuestionPayload {
  questionId: string;
  assemblyId: string;
  status: 'Aprobada' | 'Rechazada' | 'Respondida';
  answerText?: string;
}

interface UpvotePayload {
  questionId: string;
  assemblyId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/qa',
})
@Injectable()
export class QaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QaGateway.name);
  private connectedUsers: Map<string, { socketId: string; assemblyId: string; role: string }> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove user from connected users
    for (const [userId, data] of this.connectedUsers.entries()) {
      if (data.socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected from QA`);
        break;
      }
    }
  }

  @SubscribeMessage('join_assembly')
  handleJoinAssembly(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { assemblyId, userId, role } = payload;
    
    // Join the assembly room
    client.join(`assembly:${assemblyId}`);
    
    // Store user connection info
    this.connectedUsers.set(userId, {
      socketId: client.id,
      assemblyId,
      role,
    });

    // Notify others in the room
    client.to(`assembly:${assemblyId}`).emit('user_joined', {
      userId,
      role,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userId} (${role}) joined assembly ${assemblyId}`);
    
    return {
      event: 'joined',
      data: {
        assemblyId,
        userId,
        role,
        timestamp: new Date(),
      },
    };
  }

  @SubscribeMessage('leave_assembly')
  handleLeaveAssembly(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { assemblyId, userId } = payload;
    
    client.leave(`assembly:${assemblyId}`);
    this.connectedUsers.delete(userId);

    client.to(`assembly:${assemblyId}`).emit('user_left', {
      userId,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userId} left assembly ${assemblyId}`);
    
    return {
      event: 'left',
      data: {
        assemblyId,
        userId,
      },
    };
  }

  @SubscribeMessage('send_question')
  handleSendQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const { assemblyId, userId, userName, questionText, isPrivate } = payload;

    // Broadcast to all users in the assembly room
    // If private, only notify moderators/admins
    if (isPrivate) {
      // Send to moderators only
      this.server.to(`assembly:${assemblyId}`).emit('new_private_question', {
        id: `temp_${Date.now()}`,
        userId,
        userName,
        questionText,
        isPrivate: true,
        status: 'Pendiente',
        created_at: new Date(),
      });
    } else {
      // Send to all participants
      this.server.to(`assembly:${assemblyId}`).emit('new_question', {
        id: `temp_${Date.now()}`,
        userId,
        userName,
        questionText,
        isPrivate: false,
        status: 'Pendiente',
        created_at: new Date(),
      });
    }

    this.logger.log(`Question sent in assembly ${assemblyId} by user ${userId}`);

    return {
      event: 'question_sent',
      data: {
        status: 'pending_moderation',
        timestamp: new Date(),
      },
    };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const { assemblyId, userId, userName, isTyping } = payload;

    client.to(`assembly:${assemblyId}`).emit('user_typing', {
      userId,
      userName,
      isTyping,
    });

    return {
      event: 'typing_acknowledged',
      data: { isTyping },
    };
  }

  @SubscribeMessage('moderate_question')
  handleModerateQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ModerateQuestionPayload,
  ) {
    const { questionId, assemblyId, status, answerText } = payload;

    // Broadcast to all users in the assembly room
    this.server.to(`assembly:${assemblyId}`).emit('question_moderated', {
      questionId,
      status,
      answerText,
      answered_at: status === 'Respondida' ? new Date() : null,
      moderated_at: new Date(),
    });

    this.logger.log(`Question ${questionId} moderated as ${status} in assembly ${assemblyId}`);

    return {
      event: 'question_moderated',
      data: {
        questionId,
        status,
        timestamp: new Date(),
      },
    };
  }

  @SubscribeMessage('upvote_question')
  handleUpvote(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpvotePayload,
  ) {
    const { questionId, assemblyId } = payload;

    // Broadcast the upvote to all users
    this.server.to(`assembly:${assemblyId}`).emit('question_upvoted', {
      questionId,
      timestamp: new Date(),
    });

    return {
      event: 'upvote_acknowledged',
      data: {
        questionId,
        timestamp: new Date(),
      },
    };
  }

  @SubscribeMessage('answer_question')
  handleAnswerQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { questionId: string; assemblyId: string; answerText: string },
  ) {
    const { questionId, assemblyId, answerText } = payload;

    // Broadcast the answer to all users
    this.server.to(`assembly:${assemblyId}`).emit('question_answered', {
      questionId,
      answerText,
      answered_at: new Date(),
      status: 'Respondida',
    });

    this.logger.log(`Question ${questionId} answered in assembly ${assemblyId}`);

    return {
      event: 'answer_sent',
      data: {
        questionId,
        timestamp: new Date(),
      },
    };
  }

  // Helper method to emit events from service
  emitNewQuestion(assemblyId: string, question: any) {
    this.server.to(`assembly:${assemblyId}`).emit('new_question', question);
  }

  emitQuestionModerated(assemblyId: string, data: any) {
    this.server.to(`assembly:${assemblyId}`).emit('question_moderated', data);
  }

  emitQuestionAnswered(assemblyId: string, data: any) {
    this.server.to(`assembly:${assemblyId}`).emit('question_answered', data);
  }

  emitQuestionUpvoted(assemblyId: string, data: any) {
    this.server.to(`assembly:${assemblyId}`).emit('question_upvoted', data);
  }

  emitUserTyping(assemblyId: string, data: any) {
    this.server.to(`assembly:${assemblyId}`).emit('user_typing', data);
  }

  // Get connected users count for an assembly
  getConnectedUsersCount(assemblyId: string): number {
    let count = 0;
    for (const [, data] of this.connectedUsers.entries()) {
      if (data.assemblyId === assemblyId) {
        count++;
      }
    }
    return count;
  }
}