import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray, Matches, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'customer_id debe ser un string alfanumérico'
  })
  customer_id: string;

  @IsString()
  @IsNotEmpty()
  issue_date: string;

  @IsString()
  @IsNotEmpty()
  due_date: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsNumber()
  @IsNotEmpty()
  total_amount: number;

  @IsNumber()
  @IsOptional()
  price_plan?: number;

  @IsBoolean()
  @IsOptional()
  shipping_insurance?: boolean;

  @IsArray()
  @IsNotEmpty()
  @Type(() => InvoiceItemDto)
  invoice_items: InvoiceItemDto[];
} 
