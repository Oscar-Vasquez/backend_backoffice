import { Response, Request } from 'express';
import { EmailService } from './email.service';
import { EmailCampaign, EmailSendResult } from '../types/email-template';
import { PrismaService } from '../prisma/prisma.service';
export declare class EmailController {
    private readonly emailService;
    private readonly prisma;
    private readonly logger;
    constructor(emailService: EmailService, prisma: PrismaService);
    sendCampaign(campaign: EmailCampaign): Promise<EmailSendResult[]>;
    getCampaigns(): Promise<EmailCampaign[]>;
    getCampaignById(id: string): Promise<EmailCampaign>;
    deleteCampaign(id: string): Promise<void>;
    trackEmailOpen(trackingId: string, req: Request, res: Response): Promise<void>;
    trackEmailClick(campaignId: string, recipientId: string, targetUrl: string, res: Response): Promise<void>;
}
