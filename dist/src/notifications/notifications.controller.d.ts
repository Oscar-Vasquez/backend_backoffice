import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    sendNotification(notification: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getNotifications(userId: string): Promise<{
        id: string;
    }[]>;
    markAsRead(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteNotification(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
