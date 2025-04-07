import { PaymentTypesService, PaymentType } from './payment-types.service';
export declare class PaymentTypesController {
    private readonly paymentTypesService;
    constructor(paymentTypesService: PaymentTypesService);
    getAllPaymentTypes(includeInactive?: string): Promise<PaymentType[]>;
    getPaymentTypeById(id: string): Promise<PaymentType>;
    getPaymentTypeByCode(code: string): Promise<PaymentType>;
}
