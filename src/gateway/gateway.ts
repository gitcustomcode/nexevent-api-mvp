import { Logger, UnprocessableEntityException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/services/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly prisma: PrismaService) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('printSuccess')
  async handleMessage(client: Socket, payload: { participantId: string }) {
    if (!payload.participantId) {
      return `participantId is required`;
    }

    await this.prisma.eventParticipant.update({
      where: {
        id: payload.participantId,
      },
      data: {
        isPrinted: true,
        status: 'COMPLETE',
      },
    });

    this.server.emit('printSuccess', 'OK', client.id);
    return 'ok';
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  async handleConnection(client: Socket) {
    if (!client.handshake.query.eventId) {
      throw new UnprocessableEntityException(
        'Connection is not established for client',
      );
    }

    const connectionExists = await this.prisma.webSocketConnection.findFirst({
      where: {
        ClientId: client.id,
        eventId: client.handshake.query.eventId.toString(),
      },
    });

    if (connectionExists) {
      return;
    }

    await this.prisma.webSocketConnection.create({
      data: {
        ClientId: client.id,
        eventId: client.handshake.query.eventId.toString(),
      },
    });

    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const connectionExists = await this.prisma.webSocketConnection.findFirst({
      where: {
        ClientId: client.id,
        eventId: client.handshake.query.eventId.toString(),
      },
    });

    if (connectionExists) {
      await this.prisma.webSocketConnection.delete({
        where: {
          id: connectionExists.id,
        },
      });
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }
}
