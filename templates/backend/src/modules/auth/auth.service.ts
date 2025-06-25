import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs'; // Changed import syntax
import { PrismaService } from '@common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UsersService } from '@modules/users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as nodemailer from 'nodemailer';
import { generateOtp, getEmailTemplate } from './auth.helper';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

@Injectable()
export class AuthService {
  async checkUserExist(phoneNumber: string): Promise<boolean> {
    const user = await this.userService.findOneByPhoneNumber(phoneNumber);
    return !!user;
  }

  private transporter: nodemailer.Transporter;
  private readonly OTP_EXPIRY_MINUTES = 1;

  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize nodemailer transporter with Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async validateUser(credential: string, isEmail: boolean, password: string): Promise<UserResponseDto> {
    console.log('Login Api:', credential, password);
    const user = await this.prisma.user.findUnique({
      where: isEmail ? { email: credential } : { phoneNumber: credential },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch: boolean = await this.verifyPassword(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }

    // Process permissions for easier access
    const directPermissions = user.permissions?.map((p) => p.permission.name) || [];
    const rolePermissions =
      user.roles?.flatMap((userRole) => userRole.role.permissions?.map((rp) => rp.permission.name) || []) || [];
    const allPermissions = [...new Set([...directPermissions, ...rolePermissions])];

    const { password: _password, ...userWithoutPassword } = user;

    console.log('Login Response: ', userWithoutPassword);

    return {
      ...userWithoutPassword,
      preferredPronouns: userWithoutPassword.preferredPronouns ?? undefined,
      address: userWithoutPassword.address ?? undefined,
      zip: userWithoutPassword.zip ?? undefined,
      isActive: userWithoutPassword.isActive ?? undefined,
      isEmailVerified: userWithoutPassword.isEmailVerified ?? undefined,
      roles: userWithoutPassword.roles.map((role) => role.role.name),
      permissions: allPermissions,
    };
  }

  async register(dto: RegisterDto): Promise<LoginResponseDto> {
    // Check if user already exists
    const existingUser = await this.userService.findOneByEmail(dto.email);

    if (existingUser) throw new ConflictException('Email already registered');

    const encPassword = await this.hashPassword(dto.password);

    const user = await this.userService.create(dto);

    return this.login(user);
  }

  async login(user: UserResponseDto): Promise<LoginResponseDto> {
    return {
      accessToken: this.generateAccessToken(user),
      user: user,
    };
  }

  private generateAccessToken(user: UserResponseDto): string {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const accessExpires = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';

    const accessToken = this.jwtService.sign(
      { user: user },
      {
        secret: accessSecret,
        expiresIn: accessExpires,
      },
    );

    return accessToken;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /* ============================================> Forgot Password Start <============================================*/
  // async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
  //   otpId: string;
  //   expiryTime: number;
  // }> {
  //   const { credential, type } = forgotPasswordDto;

  //   if (!credential) {
  //     throw new BadRequestException('Email / Phone number is required');
  //   }

  //   let user: UserResponseDto | null = null;

  //   switch (type) {
  //     case 'email':
  //       {
  //         user = await this.userService.findOneByEmail(credential);
  //         if (!user) {
  //           throw new BadRequestException('User not found');
  //         }

  //         const { code, otpId } = await this.createOtp(user.userId);

  //         await this.sendEmail(
  //           credential,
  //           'Password Reset Verification Code',
  //           `Your verification code is: ${code}`,
  //           getEmailTemplate(code, this.OTP_EXPIRY_MINUTES),
  //         );

  //         return {
  //           otpId,
  //           expiryTime: this.OTP_EXPIRY_MINUTES * 60, // Convert minutes to seconds
  //         };
  //       }
  //       break;
  //     case 'phoneNumber':
  //       {
  //         user = await this.userService.findOneByPhoneNumber(credential);
  //         if (!user) {
  //           throw new BadRequestException('User not found');
  //         }
  //         const expiresAt = new Date();
  //         expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

  //         const { verificationId } = forgotPasswordDto;
  //         console.log('user.userId', user.userId);
  //         console.log('otpCode', verificationId);
  //         console.log('otpCode', expiresAt);
  //         const otp = await this.prisma.otp.create({
  //           data: {
  //             userId: user.userId,
  //             otpCode: '',
  //             expiresAt,
  //             verificationId: verificationId ?? '',
  //           },
  //         });
  //         console.log('otp', otp);
  //         return {
  //           otpId: otp.otpId,
  //           expiryTime: this.OTP_EXPIRY_MINUTES * 60, // Convert minutes to seconds
  //         };
  //       }
  //       break;
  //     default:
  //       throw new BadRequestException('Invalid type. Must be "email" or "phoneNumber".');
  //   }
  // }

  // private async createOtp(userId: string): Promise<{ otpId: string; code: string }> {
  //   const code = generateOtp();
  //   const expiresAt = new Date();
  //   expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

  //   const otp = await this.prisma.otp.create({
  //     data: {
  //       userId,
  //       otpCode: code,
  //       expiresAt,
  //       verificationId: '',
  //     },
  //   });

  //   return { otpId: otp.otpId, code };
  // }

  private async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new BadRequestException('Failed to send email: ' + error.message);
    }
  }

  // async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
  //   const { otpId, otp, isEmail } = verifyOtpDto;

  //   if (!otpId) {
  //     throw new BadRequestException('otpId is required');
  //   }

  //   if (!otp) {
  //     throw new BadRequestException('otp is required');
  //   }

  //   const otpRecord = await this.prisma.otp.findUnique({
  //     where: { otpId },
  //   });

  //   if (!otpRecord) {
  //     throw new BadRequestException('Invalid OTP');
  //   }

  //   if (new Date() > otpRecord.expiresAt) {
  //     throw new BadRequestException('OTP has expired');
  //   }

  //   if (otpRecord.isUsed) {
  //     throw new BadRequestException('OTP has already been used');
  //   }

  //   if (isEmail) {
  //     if (otpRecord.otpCode !== otp) {
  //       throw new BadRequestException('Invalid OTP code');
  //     }
  //   }

  //   await this.prisma.otp.update({
  //     where: { otpId },
  //     data: { isUsed: true },
  //   });

  //   return { message: 'OTP verified successfully' };
  // }

  /* ============================================> Forgot Password end <============================================*/

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { credential, newPassword, isEmail } = resetPasswordDto;
    if (!credential) {
      throw new BadRequestException('Email / Phone Number is required');
    }
    if (!newPassword) {
      throw new BadRequestException('password is required');
    }
    if (isEmail) {
      const user = await this.userService.findOneByEmail(credential);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const hashedPassword = await this.hashPassword(newPassword);
      await this.prisma.user.update({
        where: { email: credential },
        data: { password: hashedPassword },
      });
    } else {
      const user = await this.userService.findOneByPhoneNumber(credential);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const hashedPassword = await this.hashPassword(newPassword);

      await this.prisma.user.update({
        where: { phoneNumber: credential },
        data: { password: hashedPassword },
      });
    }
    return { message: 'Password reset successfully' };
  }

  async refreshAccessToken(oldToken: string): Promise<LoginResponseDto> {
    console.log('Old Token:', oldToken);
    const payload = this.jwtService.verify(oldToken, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || '',
      ignoreExpiration: true,
    });
    console.log('Payload:', payload);
    const user = payload.user as UserResponseDto;
    const newAccessToken = this.generateAccessToken(user);

    return {
      accessToken: newAccessToken,
      user: user,
    };
  }
}
