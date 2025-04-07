export interface Invoice {
    id: string;
    userId: string;
    amount: number;
    status: 'PENDIENTE' | 'PAGADO';
    date: string;
    description?: string;
    paymentDate?: string;
    transactionId?: string;
    packages: {
        packageId: string;
        trackingNumber: string;
        status: string;
        weight: number;
        volumetricWeight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        insurance: boolean;
        shippingStages: Array<{
            location: string;
            photo?: string;
            stage: string;
            status: string;
            updatedTimestamp: any;
        }>;
    }[];
    totalPackages: number;
}
