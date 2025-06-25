import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  credential: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  verificationId?: string;
}