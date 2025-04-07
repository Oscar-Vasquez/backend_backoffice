import { PrismaService } from '../prisma/prisma.service';
export interface PaymentType {
    id: string;
    name: string;
    code: string;
    icon?: string;
    description?: string;
    is_active: boolean;
    processing_fee_percentage?: string;
    processing_fee_fixed?: string;
    requires_approval?: boolean;
    created_at: string;
    updated_at: string;
}
export declare class PaymentTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private generateCodeFromName;
    private mapDatabaseToApiFormat;
    getAllPaymentTypes(includeInactive?: boolean): Promise<PaymentType[]>;
    getPaymentTypeById(id: string): Promise<PaymentType>;
    getPaymentTypeByCode(code: string): Promise<PaymentType>;
}
