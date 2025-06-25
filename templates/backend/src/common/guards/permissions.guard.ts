import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.user?.permissions) {
      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.every((permission) => request.user.permissions.includes(permission));

      if (!hasPermission) {
        throw new ForbiddenException(`Insufficient permissions: required ${requiredPermissions}`);
      }
    } else {
      return false;
    }
    return true;
  }
}
