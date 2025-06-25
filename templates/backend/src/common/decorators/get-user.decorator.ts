import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((key: keyof UserResponseDto | undefined, ctx: ExecutionContext) => {
  const req: Express.Request = ctx.switchToHttp().getRequest();
  if (key) {
    // @ts-ignore
    return req.user ? req.user[key] : undefined;
  }
  return req.user ? req.user : undefined;
});
