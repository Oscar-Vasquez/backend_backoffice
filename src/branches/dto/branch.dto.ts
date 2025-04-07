import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsObject, IsEmail, IsUUID, IsJSON } from 'class-validator';
import { VehicleDto } from '../../firebase/dto/vehicle.dto';
import { BranchProductDto } from '../../firebase/dto/product.dto';

export class ProductDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;
}

export class CreateBranchDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsString()
  @IsOptional()
  manager_name?: string;

  @IsJSON()
  @IsOptional()
  opening_hours?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  @IsObject()
  vehicles?: any;

  @IsOptional()
  @IsObject()
  products?: any;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsString()
  @IsOptional()
  manager_name?: string;

  @IsJSON()
  @IsOptional()
  opening_hours?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  @IsObject()
  vehicles?: any;

  @IsOptional()
  @IsObject()
  products?: any;
} 