import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ActivitiesService } from '../activities.service';
import { ActivityAction } from '../interfaces/operator-activity.interface';
export interface ActivityLoggerOptions {
    action: ActivityAction;
    description: string;
    entityType?: string;
    getEntityId?: (result: any) => string;
    getMetadata?: (result: any) => Record<string, any>;
}
export declare class ActivityLoggerInterceptor implements NestInterceptor {
    private readonly activitiesService;
    private readonly options;
    constructor(activitiesService: ActivitiesService, options: ActivityLoggerOptions);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
