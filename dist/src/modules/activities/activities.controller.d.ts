import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { OperatorActivity } from './interfaces/operator-activity.interface';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    createActivity(createActivityDto: CreateActivityDto): Promise<OperatorActivity>;
    getOperatorActivities(operatorId: string, limit?: string): Promise<OperatorActivity[]>;
    getRecentActivities(limit?: string, days?: string): Promise<OperatorActivity[]>;
}
