import { EmailCampaign, EmailSendResult, EmailTemplate } from '../types/email-template';
import { PrismaService } from '../prisma/prisma.service';
export declare class EmailService {
    private readonly prisma;
    private transporter;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendInvoiceEmail(to: string, invoiceNumber: string, pdfBuffer: Buffer): Promise<any>;
    sendCampaign(campaign: EmailCampaign): Promise<EmailSendResult[]>;
    getCampaigns(): Promise<EmailCampaign[]>;
    generateTemplateHtml(template: EmailTemplate, campaignId?: string, recipientId?: string): string;
    private personalizeContent;
    trackEmailOpen(trackingId: string, trackingInfo?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<void>;
    sendPackageArrivalNotification(to: string, userData: {
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
        messageId: any;
        sentTo: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        sentTo: string;
        messageId?: undefined;
    }>;
}
