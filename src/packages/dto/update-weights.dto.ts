import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateWeightsDto {
  @ApiProperty({ description: 'Package weight in kilograms', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight: number;

  @ApiProperty({ description: 'Package volumetric weight', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volumetric_weight: number;
} 