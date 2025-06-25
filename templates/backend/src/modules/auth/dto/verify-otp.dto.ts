import { IsString, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  otpId: string;

  @IsBoolean()
  @IsNotEmpty()
  isEmail: boolean;

  @IsString()
  @IsNotEmpty()
  otp: string;
}