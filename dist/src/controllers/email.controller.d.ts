import { Request, Response } from 'express';
export declare class EmailController {
    static sendCampaign(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static trackOpen(req: Request, res: Response): Promise<void>;
    static trackClick(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getMetrics(req: Request, res: Response): Promise<void>;
    static handleBounce(req: Request, res: Response): Promise<void>;
    static handleResponse(req: Request, res: Response): Promise<void>;
    static getCampaigns(req: Request, res: Response): Promise<void>;
    static getCampaignById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteCampaign(req: Request, res: Response): Promise<void>;
}
