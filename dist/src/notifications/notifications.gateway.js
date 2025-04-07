"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let NotificationsGateway = class NotificationsGateway {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger('NotificationsGateway');
        this.connectedClients = new Map();
        this.logger.log('🚀 Iniciando gateway de notificaciones...');
    }
    handleConnection(client) {
        this.logger.log(`🔌 Cliente conectado: ${client.id} desde ${client.handshake.address}`);
        this.logger.debug(`📊 Total clientes conectados: ${this.connectedClients.size + 1}`);
        this.connectedClients.set(client.id, client);
        client.emit('connected', {
            message: 'Conectado al servidor de notificaciones',
            clientId: client.id,
            address: client.handshake.address,
            namespace: '/notifications'
        });
    }
    handleDisconnect(client) {
        this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
        this.logger.debug(`📊 Total clientes conectados: ${this.connectedClients.size - 1}`);
        this.connectedClients.delete(client.id);
    }
    sendInvoiceNotification(invoiceData) {
        this.logger.log('📝 Enviando notificación de factura:', invoiceData);
        this.logger.debug(`📊 Enviando a ${this.connectedClients.size} clientes`);
        try {
            this.server.emit('newInvoice', {
                message: 'Nueva factura generada',
                data: invoiceData,
                timestamp: new Date().toISOString(),
                totalClients: this.connectedClients.size
            });
            this.logger.log('✅ Notificación enviada exitosamente');
        }
        catch (error) {
            this.logger.error('❌ Error al enviar notificación:', error);
        }
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
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
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map