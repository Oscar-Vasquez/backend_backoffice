import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateOperatorTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
} 