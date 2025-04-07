import { Request } from 'express';
import { CargoService } from './cargo.service';
import { ShipmentDetails } from './interfaces/shipment-details.interface';
import { PackagesService } from '../packages/packages.service';
import { PrismaService } from '../prisma/prisma.service';
interface RequestWithUser extends Request {
    user: {
        id?: string;
        sub?: string;
        email: string;
        role: string;
        branchReference?: string;
    };
}
export declare class CargoController {
    private readonly cargoService;
    private readonly packagesService;
    private readonly prisma;
    constructor(cargoService: CargoService, packagesService: PackagesService, prisma: PrismaService);
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
    findByTracking(trackingNumber: string, request: Request): Promise<{
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
    getExternalTracking(trackingNumber: string, req: RequestWithUser): Promise<ShipmentDetails | {
        tracking: string;
        status: import(".prisma/client").$Enums.package_status_enum;
        status_name: string;
        total_weight: string;
        vol_weight: string;
        cargo_length: string;
        cargo_width: string;
        cargo_height: string;
        unit: string;
        mode: string;
        shipper: string;
    }>;
    private mapExternalStatus;
}
export {};
