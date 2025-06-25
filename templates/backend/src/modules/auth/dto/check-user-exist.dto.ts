import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckUserExistDto {
  @ApiProperty({
    description: 'Phone number to check for existence',
    example: '+1234567890'
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
