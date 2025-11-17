import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // userId -> Set of socket IDs

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      // Store user connection
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      this.connectedClients.get(userId)!.add(client.id);

      // Store userId in socket data
      client.data.userId = userId;

      this.logger.log(`Client ${client.id} connected (User: ${userId})`);
      this.logger.log(`Total connected clients: ${this.server.sockets.sockets.size}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(userId);
        }
      }
    }

    this.logger.log(`Client ${client.id} disconnected (User: ${userId || 'unknown'})`);
    this.logger.log(`Total connected clients: ${this.server.sockets.sockets.size}`);
  }

  @SubscribeMessage('subscribe:package')
  handleSubscribeToPackage(
    @MessageBody() data: { trackingNumber: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `package:${data.trackingNumber}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:package')
  handleUnsubscribeFromPackage(
    @MessageBody() data: { trackingNumber: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `package:${data.trackingNumber}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  @SubscribeMessage('subscribe:hub')
  handleSubscribeToHub(@MessageBody() data: { hubId: string }, @ConnectedSocket() client: Socket) {
    const room = `hub:${data.hubId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:hub')
  handleUnsubscribeFromHub(
    @MessageBody() data: { hubId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `hub:${data.hubId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  @SubscribeMessage('subscribe:batch')
  handleSubscribeToBatch(
    @MessageBody() data: { batchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `batch:${data.batchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  // Emit methods for other services to use

  /**
   * Emit package status update to all subscribers
   */
  emitPackageUpdate(trackingNumber: string, data: any) {
    const room = `package:${trackingNumber}`;
    this.server.to(room).emit('package:updated', data);
    this.logger.log(`Emitted package update to room ${room}`);
  }

  /**
   * Emit package location update
   */
  emitPackageLocation(trackingNumber: string, data: any) {
    const room = `package:${trackingNumber}`;
    this.server.to(room).emit('package:location', data);
    this.logger.log(`Emitted package location to room ${room}`);
  }

  /**
   * Emit delivery status update
   */
  emitDeliveryUpdate(trackingNumber: string, data: any) {
    const room = `package:${trackingNumber}`;
    this.server.to(room).emit('delivery:updated', data);
    this.logger.log(`Emitted delivery update to room ${room}`);
  }

  /**
   * Emit hub update to all subscribers
   */
  emitHubUpdate(hubId: string, data: any) {
    const room = `hub:${hubId}`;
    this.server.to(room).emit('hub:updated', data);
    this.logger.log(`Emitted hub update to room ${room}`);
  }

  /**
   * Emit batch update to all subscribers
   */
  emitBatchUpdate(batchId: string, data: any) {
    const room = `batch:${batchId}`;
    this.server.to(room).emit('batch:updated', data);
    this.logger.log(`Emitted batch update to room ${room}`);
  }

  /**
   * Emit notification to a specific user
   */
  emitUserNotification(userId: string, data: any) {
    const userSockets = this.connectedClients.get(userId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit('notification', data);
      });
      this.logger.log(`Emitted notification to user ${userId}`);
    }
  }

  /**
   * Broadcast system message to all connected clients
   */
  broadcastSystemMessage(data: any) {
    this.server.emit('system:message', data);
    this.logger.log('Broadcast system message to all clients');
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      totalUsers: this.connectedClients.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()),
    };
  }
}
