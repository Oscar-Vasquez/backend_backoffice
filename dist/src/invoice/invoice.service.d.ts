import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceDto } from '../firebase/dto/invoice.dto';
export declare class InvoiceService {
    private readonly db;
    constructor();
    create(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceDto>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<InvoiceDto>;
    updateStatus(id: string, status: string): Promise<InvoiceDto>;
    remove(id: number): Promise<void>;
}
