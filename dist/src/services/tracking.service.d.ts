import { EmailCampaignMetrics } from '../types/email-template';
interface TrackingInfo {
    userAgent?: string;
    ipAddress?: string;
}
export declare class TrackingService {
    static recordOpen(trackingId: string, trackingInfo?: TrackingInfo): Promise<void>;
    private static getOpenCount;
    private static getDeviceType;
    static recordClick(trackingId: string, linkId: string): Promise<void>;
    static recordBounce(bounceData: any): Promise<void>;
    static recordResponse(responseData: any): Promise<void>;
    static getCampaignMetrics(campaignId: string): Promise<EmailCampaignMetrics>;
    private static calculateDeviceMetrics;
    private static updateCampaignMetrics;
}
export {};
