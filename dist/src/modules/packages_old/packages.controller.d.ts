import { PackagesService } from './packages.service';
import { Request } from 'express';
import { CargoService } from '../../cargo/cargo.service';
interface RequestWithUser extends Request {
    user: {
        id?: string;
        sub?: string;
        email: string;
        role: string;
        branchReference?: string;
    };
}
export declare class PackagesController {
    private readonly packagesService;
    private readonly cargoService;
    constructor(packagesService: PackagesService, cargoService: CargoService);
    findByTracking(trackingNumber: string, req: RequestWithUser): Promise<any>;
    createPackage(packageData: any, req: RequestWithUser): Promise<any>;
    assignUserToPackage(packageId: string, { userId }: {
        userId: string;
    }, req: RequestWithUser): Promise<{
        id: string;
        name: string;
        email: any;
        message: string;
        activityId: string;
    } | {
        id: string;
        message: string;
    }>;
    updatePackageStatus(packageId: string, { status }: {
        status: string;
    }, req: RequestWithUser): Promise<{
        success: boolean;
        message: string;
        packageId: any;
        tracking: any;
        newStatus: string;
    }>;
}
export {};
