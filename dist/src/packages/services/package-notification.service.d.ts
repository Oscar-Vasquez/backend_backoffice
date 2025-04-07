import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { SupabaseEmailService } from '../../email/supabase-email.service';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class PackageNotificationService {
    private readonly prisma;
    private readonly emailService;
    private readonly supabaseEmailService;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, supabaseEmailService: SupabaseEmailService, notificationsService: NotificationsService);
    notifyPackageArrival(packageId: string, useSupabase?: boolean): Promise<{
        success: boolean;
        packageId: string;
        trackingNumber: string;
        emailResult: any;
        error?: undefined;
    } | {
        success: boolean;
        packageId: string;
        error: any;
        trackingNumber?: undefined;
        emailResult?: undefined;
    }>;
    notifyBulkPackageArrival(packageIds: string[], useSupabase?: boolean): Promise<{
        total: number;
        successful: number;
        failed: number;
        details: any[];
    }>;
}
