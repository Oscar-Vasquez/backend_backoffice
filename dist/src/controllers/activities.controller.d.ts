import { ActivitiesService } from '../modules/activities/activities.service';
import { CreateActivityDto } from '../modules/activities/dto/create-activity.dto';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    createActivity(createActivityDto: CreateActivityDto): Promise<any>;
    getActivities(): Promise<any[]>;
}
