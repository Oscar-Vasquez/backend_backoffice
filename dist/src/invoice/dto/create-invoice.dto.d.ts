export declare class CreateInvoiceItemDto {
    name: string;
    description?: string;
    quantity: number;
    price: number;
}
export declare class CreateInvoiceDto {
    invoice_number: string;
    customer_id: number;
    issue_date: Date;
    due_date: Date;
    status?: string;
    total_amount: number;
    paid_amount?: number;
    notes?: string;
    footer?: string;
    invoice_items: CreateInvoiceItemDto[];
}
