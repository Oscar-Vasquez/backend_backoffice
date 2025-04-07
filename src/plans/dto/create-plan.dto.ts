import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsNotEmpty()
  @IsString()
  planName: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  branchReference: string;

  @IsOptional()
  @IsString()
  planId?: string;
} 