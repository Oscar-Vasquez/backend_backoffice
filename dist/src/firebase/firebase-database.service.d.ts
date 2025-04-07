import { BranchDto } from './dto/branch.dto';
import { OperatorDto } from './dto/operator.dto';
import { UserDto } from './dto/user.dto';
import { CompanyDto } from './dto/company.dto';
import { FirebaseService } from './firebase.service';
import { EmailTemplateDto } from './dto/template.dto';
import { EmailTemplate, EmailCampaign } from '../types/email-template';
import { EmailService } from '../email/email.service';
export declare class FirebaseDatabaseService {
    private readonly firebaseService;
    private readonly emailService;
    private readonly db;
    private readonly logger;
    constructor(firebaseService: FirebaseService, emailService: EmailService);
    getCollection(collectionName: string): FirebaseFirestore.CollectionReference;
    private convertTimestampToDate;
    initializeDatabase(data: {
        branches?: {
            [key: string]: BranchDto;
        };
        operators?: {
            [key: string]: OperatorDto;
        };
        users?: {
            [key: string]: UserDto;
        };
        companies?: {
            [key: string]: CompanyDto;
        };
    }): Promise<void>;
    deleteDatabase(): Promise<void>;
    resetDatabase(newData: any): Promise<void>;
    verifyDatabase(): Promise<{
        collections: {
            [key: string]: number;
        };
    }>;
    private generateTemplateThumbnail;
    private captureHtmlAsImage;
    private uploadBase64Image;
    saveEmailTemplate(template: EmailTemplate): Promise<EmailTemplate>;
    getEmailTemplates(userId: string): Promise<EmailTemplateDto[]>;
    getEmailTemplateById(templateId: string): Promise<EmailTemplateDto>;
    deleteEmailTemplate(templateId: string): Promise<void>;
    updateCampaignStats(campaignId: string, stats: any): Promise<void>;
    getEmailCampaigns(userId: string): Promise<EmailCampaign[]>;
    getEmailCampaignById(campaignId: string): Promise<any>;
    deleteEmailCampaign(campaignId: string): Promise<void>;
    updateEmailTemplate(templateId: string, template: EmailTemplate): Promise<EmailTemplate>;
    createEmailCampaign(campaignData: EmailCampaign): Promise<string>;
    updateEmailCampaignStatus(campaignId: string, status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed', updatedAt?: Date): Promise<void>;
    trackEmailOpen(trackingId: string, trackingInfo?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<void>;
    private getDeviceType;
    trackEmailClick(campaignId: string, recipientId: string): Promise<void>;
    private getCampaignMetrics;
    private calculateDeviceMetrics;
}
