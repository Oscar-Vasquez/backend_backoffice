import { InvoicesService } from './invoices.service';
import { Request } from 'express';
interface RequestWithUser extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    createInvoice(invoiceData: any, req: RequestWithUser): Promise<any>;
}
export {};
