import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Whether the credential is an email (true) or phone number (false)',
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isEmail: boolean;

  @ApiProperty({
    description: 'User credential (email or phone number)',
    example: 'superadmin@clinic.com'
  })
  @ValidateIf(o => o.isEmail)
  @IsEmail()
  @IsNotEmpty()
  credential: string;

  @ApiProperty({
    description: 'User password',
    example: 'superadmin123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
