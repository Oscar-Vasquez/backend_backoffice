import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivitiesService } from '../activities.service';
import { Request } from 'express';
import { ActivityAction, ActivityStatus } from '../interfaces/operator-activity.interface';

export interface ActivityLoggerOptions {
  action: ActivityAction;
  description: string;
  entityType?: string;
  getEntityId?: (result: any) => string;
  getMetadata?: (result: any) => Record<string, any>;
}

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly options: ActivityLoggerOptions
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any; // El usuario autenticado desde el AuthGuard

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.activitiesService.createActivity({
            operatorId: user.id,
            operatorName: user.name,
            action: this.options.action,
            description: this.options.description,
            entityType: this.options.entityType,
            entityId: this.options.getEntityId ? this.options.getEntityId(result) : undefined,
            metadata: this.options.getMetadata ? this.options.getMetadata(result) : undefined,
            status: ActivityStatus.COMPLETED
          });
        } catch (error) {
          console.error('Error al registrar actividad:', error);
        }
      })
    );
  }
} 