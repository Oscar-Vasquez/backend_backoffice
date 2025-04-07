import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class NotificationsService {
  private readonly db: admin.firestore.Firestore;

  constructor(private readonly firebaseService: FirebaseService) {
    this.db = this.firebaseService.getFirestore();
  }

  async sendNotification(userId: string, notification: any) {
    try {
      await this.db.collection('notifications').add({
        userId,
        ...notification,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, message: 'Notificación enviada correctamente' };
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      throw error;
    }
  }

  async getNotifications(userId: string) {
    try {
      const snapshot = await this.db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      await this.db.collection('notifications').doc(notificationId).update({
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, message: 'Notificación marcada como leída' };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      await this.db.collection('notifications').doc(notificationId).delete();
      return { success: true, message: 'Notificación eliminada correctamente' };
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  }
} 