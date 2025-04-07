import { FirebaseService } from '../firebase/firebase.service';
import { ActivitiesService } from '../activities/activities.service';
export declare class PackagesService {
    private readonly firebaseService;
    private readonly activitiesService;
    private readonly COLLECTION;
    constructor(firebaseService: FirebaseService, activitiesService: ActivitiesService);
    createPackage(packageData: any, operatorData: {
        id: string;
        email: string;
    }): Promise<any>;
    assignUserToPackage(packageId: string, userId: string, operatorData: {
        id: string;
        email: string;
    }): Promise<{
        id: string;
        name: string;
        email: any;
        message: string;
        activityId: string;
    } | {
        id: string;
        message: string;
    }>;
    updatePackageStatus(trackingNumber: string, status: string, operatorData: {
        id: string;
        email: string;
    }): Promise<{
        success: boolean;
        message: string;
        packageId: any;
        tracking: any;
        newStatus: string;
    }>;
    findByTracking(trackingNumber: string): Promise<any>;
    private getOperatorInfo;
}
