import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  credential: string;

  @IsBoolean()
  @IsNotEmpty()
  isEmail: boolean;

}