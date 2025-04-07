import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ActivityAction, ActivityStatus } from '../interfaces/operator-activity.interface';

export class CreateActivityDto {
  @IsString()
  operatorId: string;

  @IsString()
  operatorName: string;

  @IsEnum(ActivityAction, {
    message: 'La acción debe ser un valor válido de ActivityAction'
  })
  action: ActivityAction;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsEnum(ActivityStatus, {
    message: 'El estado debe ser un valor válido de ActivityStatus'
  })
  status: ActivityStatus = ActivityStatus.COMPLETED;
} 