import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone_type?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  phone_subscription_status?: string;

  @IsOptional()
  @IsString()
  address_type?: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  street_line_2?: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  email_subscription_status?: string;
}
