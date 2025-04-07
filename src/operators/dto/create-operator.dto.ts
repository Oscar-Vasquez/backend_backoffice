import { IsEmail, IsNotEmpty, IsString, MinLength, IsUrl, IsEnum, IsOptional, IsUUID, IsISO8601, IsArray, ValidateNested, IsObject } from 'class-validator';
import { operator_role_enum, operator_status_enum } from '@prisma/client';
import { Type } from 'class-transformer';

class EmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateOperatorDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsUrl()
  @IsOptional()
  photo?: string;

  @IsEnum(operator_role_enum)
  @IsOptional()
  role?: operator_role_enum;

  @IsEnum(operator_status_enum)
  @IsOptional()
  status?: operator_status_enum;

  @IsUUID()
  @IsNotEmpty()
  branch_id: string;

  @IsUUID()
  @IsNotEmpty()
  type_operator_id: string;

  @IsISO8601()
  @IsOptional()
  hire_date?: string;

  @IsISO8601()
  @IsOptional()
  birth_date?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergency_contact?: EmergencyContactDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  personal_id?: string;

  @IsString()
  @IsOptional()
  address?: string;
} 