import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.AccessToken, // cookie extractor
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
    });
  }

  async validate(payload: any): Promise<UserResponseDto> {
    // Get user from JWT payload
    return payload.user;
  }
}
