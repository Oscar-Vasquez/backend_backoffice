import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateOperatorTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
} 