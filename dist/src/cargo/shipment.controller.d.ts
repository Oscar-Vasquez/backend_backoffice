import { CargoService } from './cargo.service';
import { PackagesService } from '../packages/packages.service';
import { Request } from 'express';
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
export declare class ShipmentController {
    private readonly cargoService;
    private readonly packagesService;
    private readonly prisma;
    constructor(cargoService: CargoService, packagesService: PackagesService, prisma: PrismaService);
    trackShipment(trackingNumber: string, req: RequestWithUser): Promise<any>;
    getTrackingDetails(trackingNumber: string, req: RequestWithUser): Promise<{
        tracking: any;
        status: {
            code: any;
            name: any;
        };
        dimensions: {
            length: any;
            width: any;
            height: any;
            unit: any;
        };
        weight: {
            total: any;
            volumetric: any;
        };
        shipment: {
            mode: any;
            carrier: any;
            receipt: any;
        };
        dates: {
            created: any;
        };
        destination: any;
        consignee: any;
        source: string;
    }>;
    private getStatusName;
    private mapExternalStatus;
}
export {};
