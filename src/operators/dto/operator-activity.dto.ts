import { IsString, IsEnum, IsOptional, IsObject, IsDate, IsNumber } from 'class-validator';
import { activity_type_enum, activity_status_enum } from '@prisma/client';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view'
}

export enum ActivityStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ActivityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view'
}

export class ActivityDetailsDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsObject()
  previousData?: any;

  @IsOptional()
  @IsObject()
  newData?: any;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class OperatorActivityDto {
  @IsString()
  id: string;

  @IsString()
  operatorId: string;

  @IsEnum(activity_type_enum)
  type: ActivityType;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsString()
  description: string;

  @IsDate()
  timestamp: Date;

  @IsEnum(activity_status_enum)
  status: ActivityStatus;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsObject()
  details?: ActivityDetailsDto;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
} 