import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { EmailService } from '../email/email.service';
export declare class InvoiceController {
    private readonly invoiceService;
    private readonly emailService;
    constructor(invoiceService: InvoiceService, emailService: EmailService);
    create(createInvoiceDto: CreateInvoiceDto): Promise<import("../firebase/dto/invoice.dto").InvoiceDto>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<import("../firebase/dto/invoice.dto").InvoiceDto>;
    updateStatus(id: string, updateData: {
        status: string;
    }): Promise<import("../firebase/dto/invoice.dto").InvoiceDto>;
    remove(id: number): Promise<{
        message: string;
    }>;
    sendInvoiceEmail(id: number, file: Express.Multer.File, email: string): Promise<{
        message: string;
    }>;
}
