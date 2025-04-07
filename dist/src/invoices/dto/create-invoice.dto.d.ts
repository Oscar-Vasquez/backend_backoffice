export declare class InvoiceItemDto {
    name: string;
    description: string;
    quantity: number;
    price: number;
}
export declare class CreateInvoiceDto {
    invoice_number?: string;
    customer_id: string;
    issue_date: string;
    due_date: string;
    status: string;
    total_amount: number;
    price_plan?: number;
    shipping_insurance?: boolean;
    invoice_items: InvoiceItemDto[];
}
