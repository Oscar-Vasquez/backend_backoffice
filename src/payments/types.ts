import { package_status_enum } from '@prisma/client';

// Constantes para los estados de facturas en la interfaz
export const INVOICE_STATUS = {
  PAID: 'PAGADO',
  PENDING: 'PENDIENTE',
  PARTIAL: 'PARCIAL'
} as const;

export type InvoiceStatusType = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

// Interfaz para las etapas de envío
export interface ShippingStage {
  // Campos relacionados con la posición del paquete
  position?: string;
  ubicacion?: string;
  location?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  
  // Campos temporales
  timestamp?: string;
  date?: string;
  time?: string;
  created_at?: string;
  
  // Campos informativos
  status?: string;
  description?: string;
  notes?: string;
  details?: string;
  
  // Campos adicionales que podrían existir
  provider?: string;
  carrier?: string;
  tracking_url?: string;
  
  // Datos del operador que registró la etapa
  operator_id?: string;
  operator_name?: string;
  
  // Permitir cualquier otro campo para flexibilidad
  [key: string]: any;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  status: InvoiceStatusType;
  date: string;
  description: string;
  paymentDate?: string;
  transactionId?: string;
  userName?: string;
  userEmail?: string;
  invoiceNumber?: string;
  dueDate?: string;
  totalAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  currency?: string;
  packages?: PackageInfo[];
}

export interface PackageInfo {
  id: string;
  trackingNumber: string;
  status: package_status_enum;
  position?: string | null;
  shipping_stages?: ShippingStage[];
}

export interface ProcessPaymentDto {
  invoiceId: string;
  amount: number;
  method: string;
  amountReceived: number;
}