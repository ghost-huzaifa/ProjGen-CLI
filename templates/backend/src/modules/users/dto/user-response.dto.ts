import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IsOptional, IsString, IsBoolean, IsDate, IsEmail } from 'class-validator';

export class UserResponseDto extends OmitType(CreateUserDto, ['password'] as const) {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Gender',
    example: 'Male',
  })
  @IsString()
  gender: string;

  @ApiPropertyOptional({
    description: 'Preferred pronouns',
    example: 'he/him',
  })
  @IsString()
  @IsOptional()
  preferredPronouns?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
  })
  @IsString()
  emergencyContactName: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+1234567890',
  })
  @IsString()
  emergencyContactPhone: string;

  @ApiProperty({
    description: 'Emergency contact relation',
    example: 'Spouse',
  })
  @IsString()
  emergencyContactRelation: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address: string | undefined;

  @ApiPropertyOptional({
    description: 'ZIP code',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  zip: string | undefined;

  @ApiProperty({
    description: 'User account status',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  @IsBoolean()
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'User roles',
    example: ['ADMIN', 'USER'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'User permissions',
    example: ['USER_CREATE', 'USER_READ'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'When the user was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the user was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
