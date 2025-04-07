import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class SupabaseEmailService implements OnModuleInit {
    private readonly configService;
    private supabase;
    private transporter;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private setupNodemailerTransport;
    private useEtherealFallback;
    private sendInvoiceAndPackageEmail;
    sendInvoiceCreationEmail(email: string, userData: {
        firstName: string;
        lastName?: string;
    }, invoiceData: {
        invoiceNumber: string;
        totalAmount: number;
        issueDate: string;
        dueDate?: string;
        items: Array<{
            trackingNumber: string;
            description?: string;
            price: number;
            quantity: number;
        }>;
    }): Promise<{
        success: boolean;
        sentTo: string;
        method: string;
        fallback?: undefined;
        messageId?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        fallback: boolean;
        messageId: any;
        method: string;
        message: string;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        method: string;
        fallback: boolean;
        message: string;
        messageId?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        previewUrl: string | false;
        method: string;
        fallback: boolean;
        message: string;
        messageId?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        simulated: boolean;
        method: string;
        message: string;
        fallback?: undefined;
        messageId?: undefined;
        previewUrl?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        error: any;
        method?: undefined;
        fallback?: undefined;
        messageId?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
    }>;
    sendPackageArrivalEmail(email: string, userData: {
        firstName: string;
        lastName?: string;
    }, packageData: {
        trackingNumber: string;
        weight?: number;
        price: number;
        packageStatus?: string;
        estimatedDeliveryDate?: string;
    }): Promise<{
        success: boolean;
        sentTo: string;
        method: string;
        fallback?: undefined;
        messageId?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        fallback: boolean;
        messageId: any;
        method: string;
        message: string;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        method: string;
        fallback: boolean;
        message: string;
        messageId?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        previewUrl: string | false;
        method: string;
        fallback: boolean;
        message: string;
        messageId?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        simulated: boolean;
        method: string;
        message: string;
        fallback?: undefined;
        messageId?: undefined;
        previewUrl?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        error: any;
        method?: undefined;
        fallback?: undefined;
        messageId?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
    }>;
    sendCustomEmail(email: string, subject: string, templateData: Record<string, string>, templateName?: string): Promise<{
        success: boolean;
        sentTo: string;
        messageId: any;
        method: string;
        previewUrl?: undefined;
        debug?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        method: string;
        messageId?: undefined;
        previewUrl?: undefined;
        debug?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        previewUrl: string | false;
        method: string;
        debug: boolean;
        messageId?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        error: any;
        messageId?: undefined;
        method?: undefined;
        previewUrl?: undefined;
        debug?: undefined;
    }>;
    private sendWithEthereal;
    private sendWithMailProvider;
    sendInvoiceReminderEmail(email: string, userData: {
        firstName: string;
        lastName?: string;
    }, invoiceData: {
        invoiceNumber: string;
        totalAmount: number;
        totalPackages: number;
        issueDate: string;
    }): Promise<{
        success: boolean;
        sentTo: string;
        method: string;
        messageId?: undefined;
        fallback?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        messageId: any;
        method: string;
        fallback?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        method: string;
        fallback: boolean;
        message: string;
        messageId?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        previewUrl: string | false;
        method: string;
        fallback: boolean;
        message: string;
        messageId?: undefined;
        simulated?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        simulated: boolean;
        method: string;
        error: string;
        messageId?: undefined;
        fallback?: undefined;
        message?: undefined;
        previewUrl?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        simulated: boolean;
        method: string;
        message: string;
        messageId?: undefined;
        fallback?: undefined;
        previewUrl?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        sentTo: string;
        error: any;
        method?: undefined;
        messageId?: undefined;
        fallback?: undefined;
        message?: undefined;
        previewUrl?: undefined;
        simulated?: undefined;
    }>;
}
