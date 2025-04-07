import { IsEmail, IsOptional, IsString, MinLength, IsUrl, IsIn, IsUUID, IsISO8601, IsArray, IsObject, ValidateNested } from 'class-validator';
import { operator_role_enum, operator_status_enum } from '@prisma/client';
import { Type } from 'class-transformer';

class EmergencyContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateOperatorDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_query_components: true,
    allow_fragments: true,
    allow_underscores: true
  })
  @IsOptional()
  photo?: string;

  @IsString()
  @IsIn(Object.values(operator_role_enum))
  @IsOptional()
  role?: operator_role_enum;

  @IsString()
  @IsIn(Object.values(operator_status_enum))
  @IsOptional()
  status?: operator_status_enum;

  @IsUUID()
  @IsOptional()
  branch_id?: string;
  
  @IsUUID()
  @IsOptional()
  type_operator_id?: string;

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