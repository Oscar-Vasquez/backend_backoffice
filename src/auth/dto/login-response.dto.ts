import { ApiProperty } from '@nestjs/swagger';

class OperatorDto {
  @ApiProperty({
    description: 'Operator ID',
    example: 'op_123456',
  })
  id: string;

  @ApiProperty({
    description: 'Operator email',
    example: 'operator@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Operator first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Operator last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Operator role',
    example: 'admin',
  })
  role: string;

  @ApiProperty({
    description: 'Branch name',
    example: 'Downtown Branch',
  })
  branchName: string;

  @ApiProperty({
    description: 'Branch reference ID',
    example: 'branch_123',
  })
  branchReference: string;

  @ApiProperty({
    description: 'Operator type ID',
    example: 'type_123',
    nullable: true,
  })
  type_operator_id: string | null;

  @ApiProperty({
    description: 'Operator photo URL',
    example: 'https://example.com/photo.jpg',
    nullable: true,
  })
  photo: string | null;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Operator information',
    type: OperatorDto,
  })
  operator: OperatorDto;
} 