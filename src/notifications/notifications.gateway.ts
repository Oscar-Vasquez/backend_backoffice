import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationsGateway');
  private connectedClients = new Map<string, Socket>();

  constructor(private configService: ConfigService) {
    this.logger.log('🚀 Iniciando gateway de notificaciones...');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id} desde ${client.handshake.address}`);
    this.logger.debug(`📊 Total clientes conectados: ${this.connectedClients.size + 1}`);
    this.connectedClients.set(client.id, client);
    
    // Enviar confirmación al cliente
    client.emit('connected', { 
      message: 'Conectado al servidor de notificaciones',
      clientId: client.id,
      address: client.handshake.address,
      namespace: '/notifications'
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
    this.logger.debug(`📊 Total clientes conectados: ${this.connectedClients.size - 1}`);
    this.connectedClients.delete(client.id);
  }

  // Método para enviar notificación de nueva factura a todos los clientes conectados
  sendInvoiceNotification(invoiceData: any) {
    this.logger.log('📝 Enviando notificación de factura:', invoiceData);
    this.logger.debug(`📊 Enviando a ${this.connectedClients.size} clientes`);
    
    try {
      // Enviar a todos los clientes conectados
      this.server.emit('newInvoice', {
        message: 'Nueva factura generada',
        data: invoiceData,
        timestamp: new Date().toISOString(),
        totalClients: this.connectedClients.size
      });
      
      this.logger.log('✅ Notificación enviada exitosamente');
    } catch (error) {
      this.logger.error('❌ Error al enviar notificación:', error);
    }
  }
} 