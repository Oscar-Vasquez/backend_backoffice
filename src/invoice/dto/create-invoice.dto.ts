import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsArray, ValidateNested } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  invoice_number: string;

  @IsNotEmpty()
  @IsNumber()
  customer_id: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  issue_date: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  due_date: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNotEmpty()
  @IsNumber()
  total_amount: number;

  @IsOptional()
  @IsNumber()
  paid_amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  footer?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  invoice_items: CreateInvoiceItemDto[];
}
