import { FirebaseService } from '../firebase/firebase.service';
import { ActivitiesService } from '../activities/activities.service';
import { PackagesService } from '../../packages/packages.service';
export declare class InvoicesService {
    private readonly firebaseService;
    private readonly activitiesService;
    private readonly packagesService;
    private readonly COLLECTION;
    constructor(firebaseService: FirebaseService, activitiesService: ActivitiesService, packagesService: PackagesService);
    createInvoice(invoiceData: any, operatorData: {
        id: string;
        email: string;
    }): Promise<any>;
}
