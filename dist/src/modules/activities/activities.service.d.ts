import { FirebaseService } from '../../firebase/firebase.service';
import { CreateActivityDto } from './interfaces/operator-activity.interface';
export declare class ActivitiesService {
    private readonly firebaseService;
    private readonly COLLECTION;
    private readonly logger;
    constructor(firebaseService: FirebaseService);
    createActivity(activity: CreateActivityDto): Promise<any>;
    getRecentActivities(limit?: number, days?: number): Promise<any[]>;
    getOperatorActivities(operatorId: string, limit?: number): Promise<any[]>;
}
