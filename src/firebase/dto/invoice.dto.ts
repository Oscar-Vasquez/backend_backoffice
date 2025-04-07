export class PaymentDetailsDto {
  cardLastDigits: string;
  paymentTimestamp: Date;
}

export class InvoiceDto {
  invoiceId: string;
  userReference: string;
  totalAmount: number;
  isPaid: boolean;
  paymentMethod: string;
  paymentDetails: PaymentDetailsDto;
  invoiceStatus: string;
  createdTimestamp: Date;
  updatedTimestamp: Date;
}

export class MarketplaceInvoiceDto extends InvoiceDto {
  productReference: string;
  branchReference: string;
  commissionAmount: number;
} 