import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDimensionsDto {
  @ApiProperty({ description: 'Package length in centimeters', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  length: number;

  @ApiProperty({ description: 'Package width in centimeters', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  width: number;

  @ApiProperty({ description: 'Package height in centimeters', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  height: number;

  @ApiProperty({ description: 'Package weight in kilograms', minimum: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  weight?: number;

  @ApiProperty({ description: 'Package volumetric weight', minimum: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  volumetric_weight?: number;

  @ApiProperty({ description: 'Is the package fragile', required: false })
  @IsOptional()
  is_fragile?: boolean;
} 