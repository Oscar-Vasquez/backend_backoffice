import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum PackageStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  LOST = 'lost',
  CANCELED = 'canceled'
}

export class UpdateStatusDto {
  @ApiProperty({ 
    description: 'Package status', 
    enum: PackageStatus,
    example: 'delivered' 
  })
  @IsNotEmpty()
  @IsEnum(PackageStatus, { 
    message: 'Status must be one of the following: pending, in_transit, delivered, returned, lost, canceled' 
  })
  status: PackageStatus;
} 