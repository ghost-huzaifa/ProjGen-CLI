import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private moduleRef: ModuleRef) {
    super({
      usernameField: 'credential',
      passReqToCallback: true,
    });
  }

  async validate(request: any, credential: string, password: string): Promise<UserResponseDto> {
    const contextId = ContextIdFactory.getByRequest(request);
    const authService = await this.moduleRef.resolve(AuthService, contextId);

    const user = await authService.validateUser(credential, request.body.isEmail, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return user;
  }
}
