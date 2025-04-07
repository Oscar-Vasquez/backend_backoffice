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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firebase_service_1 = require("../firebase/firebase.service");
let NotificationsService = class NotificationsService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.db = this.firebaseService.getFirestore();
    }
    async sendNotification(userId, notification) {
        try {
            await this.db.collection('notifications').add({
                userId,
                ...notification,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, message: 'Notificación enviada correctamente' };
        }
        catch (error) {
            console.error('Error al enviar notificación:', error);
            throw error;
        }
    }
    async getNotifications(userId) {
        try {
            const snapshot = await this.db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Error al obtener notificaciones:', error);
            throw error;
        }
    }
    async markAsRead(notificationId) {
        try {
            await this.db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, message: 'Notificación marcada como leída' };
        }
        catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }
    async deleteNotification(notificationId) {
        try {
            await this.db.collection('notifications').doc(notificationId).delete();
            return { success: true, message: 'Notificación eliminada correctamente' };
        }
        catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map