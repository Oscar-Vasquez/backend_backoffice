import * as admin from 'firebase-admin';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'First name of the user', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Email of the user', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Password of the user', example: 'SecurePassword123' })
  password: string;

  @ApiProperty({ description: 'Phone number of the user', example: '+1234567890' })
  phone: string;

  @ApiProperty({ description: 'Birth date of the user in ISO format', example: '1990-01-01' })
  birthDate: string;

  @ApiProperty({ description: 'Reference to the branch', example: 'branch-123' })
  branchReference: string;

  @ApiProperty({ description: 'Subscription plan ID', example: 'plan-123' })
  subscriptionPlan: string;

  @ApiProperty({ description: 'Type user reference ID', example: 'type-123' })
  typeUserReference: string;

  @ApiProperty({ description: 'User address', example: '123 Main St, Anytown, AT 12345' })
  address: string;
}

// Interface representing a user from either Firebase or Prisma
export class FirebaseUser {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  userId: string;

  @ApiProperty({ description: 'First name of the user', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Email of the user', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Phone number of the user', example: '+1234567890' })
  phone: string;

  @ApiProperty({ description: 'User address', example: '123 Main St, Anytown, AT 12345' })
  address: string;

  @ApiProperty({ description: 'Whether the user is verified', example: true })
  isVerified: boolean;

  @ApiProperty({ description: 'Whether the user email is verified', example: true })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'User account status', example: true })
  accountStatus: boolean;

  @ApiProperty({ description: 'Birth date of the user', example: '1990-01-01' })
  birthDate: string;

  @ApiProperty({ description: 'URL to user photo', example: 'https://example.com/photo.jpg' })
  photo: string;

  @ApiProperty({
    description: 'Branch reference information',
    example: { path: 'branches/123', id: '123' }
  })
  branchReference: {
    path: string;
    id: string;
  };

  @ApiProperty({
    description: 'Multiple branch references',
    example: ['branches/123', 'branches/456'],
    required: false
  })
  branchReferences?: string[];

  @ApiProperty({ description: 'Branch name', example: 'Downtown Branch' })
  branchName: string;

  @ApiProperty({ description: 'Branch address', example: '456 Branch St, Anytown, AT 12345' })
  branchAddress: string;

  @ApiProperty({ description: 'Branch location', example: 'Downtown' })
  branchLocation: string;

  @ApiProperty({
    description: 'Subscription plan reference',
    example: { path: 'plans/123', id: '123' }
  })
  subscriptionPlan: {
    path: string;
    id: string;
  };

  @ApiProperty({
    description: 'Type user reference',
    example: { path: 'typeUsers/123', id: '123' }
  })
  typeUserReference: {
    path: string;
    id: string;
  };

  @ApiProperty({ description: 'Plan rate', example: 4.5, required: false })
  planRate?: number;

  @ApiProperty({ description: 'Subscription price', example: 29.99, required: false })
  price?: number;

  @ApiProperty({ description: 'Creation timestamp', example: '2023-01-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2023-01-15T12:00:00Z' })
  updatedAt: string;

  @ApiProperty({ description: 'Last login timestamp', example: '2023-01-20T12:00:00Z' })
  lastLoginAt: string;

  @ApiProperty({
    description: 'Wallet reference',
    example: { path: 'wallets/123', id: '123' }
  })
  walletReference: {
    path: string;
    id: string;
  };

  @ApiProperty({ description: 'Wallet name', example: 'Main Wallet' })
  walletName: string;

  @ApiProperty({ description: 'User password', example: '*****', required: false })
  password?: string;

  @ApiProperty({ description: 'Assigned locker', example: 'A123' })
  assignedLocker: string;

  @ApiProperty({ description: 'Display message', example: 'Welcome back!', required: false })
  displayMessage?: string;

  @ApiProperty({
    description: 'Subscription details',
    example: {
      planName: 'Premium',
      description: 'Premium subscription with all features',
      price: '29.99'
    },
    required: false
  })
  subscriptionDetails?: {
    planName: string;
    description: string;
    price: string;
  };

  @ApiProperty({
    description: 'Branch details',
    example: {
      name: 'Downtown Branch',
      province: 'State',
      address: '456 Branch St, Anytown, AT 12345'
    },
    required: false
  })
  branchDetails?: {
    name: string;
    province: string;
    address: string;
  };

  @ApiProperty({ description: 'Whether user has shipping insurance', example: true, required: false })
  shipping_insurance?: boolean;

  [key: string]: any;
}

// Interface for the Prisma User model
export interface PrismaUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  accountStatus: boolean;
  birthDate: Date;
  photoUrl: string;
  branchId: string;
  subscriptionPlanId: string;
  typeUserId: string;
  planRate: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  walletId: string | null;
  assignedLocker: string;
  displayMessage: string | null;
  shipping_insurance: boolean;
  
  // Relations that can be included
  branch?: any;
  subscriptionPlan?: any;
  typeUser?: any;
  wallet?: any;
}

export class UpdateStatusResponse {
  @ApiProperty({ description: 'Whether the operation was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Message describing the result', example: 'User status updated successfully' })
  message: string;

  @ApiProperty({
    description: 'Additional details about the operation',
    example: {
      userId: 'user-123',
      previousStatus: false,
      newStatus: true,
      timestamp: '2023-01-01T12:00:00Z'
    },
    required: false
  })
  details?: {
    userId: string;
    previousStatus: boolean;
    newStatus: boolean;
    timestamp: string;
  };
}

export class TypeUser {
  @ApiProperty({ description: 'Type user ID', example: 'type-123' })
  id: string;

  @ApiProperty({ description: 'Type user name', example: 'Admin' })
  name: string;

  @ApiProperty({ description: 'Type user description', example: 'Administrator with full access' })
  description: string;

  @ApiProperty({ description: 'Whether the type user is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp', example: '2023-01-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2023-01-15T12:00:00Z' })
  updatedAt: string;
}

export class SearchDto {
  @ApiProperty({ description: 'Search query', example: 'john' })
  query: string;
} 