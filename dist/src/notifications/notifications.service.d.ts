import { FirebaseService } from '../firebase/firebase.service';
export declare class NotificationsService {
    private readonly firebaseService;
    private readonly db;
    constructor(firebaseService: FirebaseService);
    sendNotification(userId: string, notification: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getNotifications(userId: string): Promise<{
        id: string;
    }[]>;
    markAsRead(notificationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteNotification(notificationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
