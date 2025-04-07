import { ActivityAction, ActivityStatus } from '../interfaces/operator-activity.interface';
export declare class CreateActivityDto {
    operatorId: string;
    operatorName: string;
    action: ActivityAction;
    description: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    status: ActivityStatus;
}
