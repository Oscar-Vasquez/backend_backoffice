import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { ShipmentDetails } from './interfaces/shipment-details.interface';
export declare class CargoService {
    private configService;
    private readonly httpService;
    private readonly baseUrl;
    constructor(configService: ConfigService, httpService: HttpService);
    getPackages(): Promise<{
        success: boolean;
        data: {
            hash: string;
            clientId: number;
            clientName: string;
            packageName: string;
            receipt: string;
            tracking: string;
            mode: string;
            shipper: string;
            totalItems: string;
            totalWeight: string;
            volWeight: string;
            dimensions: {
                length: string;
                width: string;
                height: string;
                unit: string;
            };
            status: string;
            statusName: string;
            dateCreated: string;
            dateUpdated: string;
        }[];
    }>;
    getShipmentDetails(trackingNumber: string): Observable<ShipmentDetails | null>;
    findByTracking(trackingNumber: string): Promise<{
        success: boolean;
        data: {
            hash: string;
            clientId: number;
            clientName: string;
            packageName: string;
            receipt: string;
            tracking: string;
            mode: string;
            shipper: string;
            totalItems: string;
            totalWeight: string;
            volWeight: string;
            dimensions: {
                length: string;
                width: string;
                height: string;
                unit: string;
            };
            status: string;
            statusName: string;
            dateCreated: string;
            dateUpdated: string;
        };
    }>;
    private searchWithParams;
}
