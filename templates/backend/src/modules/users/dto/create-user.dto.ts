import { IsEmail, IsString, MinLength, IsOptional, IsDate, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

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
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'User date of birth',
    example: '1990-01-01',
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'User gender',
    example: 'Male',
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional({
    description: 'User preferred pronouns',
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
    example: '+10987654321',
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
    description: 'User address',
    example: '123 Main St',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'User zip code',
    example: '12345',
  })
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiPropertyOptional({
    description: 'City ID',
    example: 'city-uuid',
  })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'Is user active',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is user email verified',
    example: false,
  })
  @IsOptional()
  isEmailVerified?: boolean;
}
