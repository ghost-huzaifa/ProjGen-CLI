import { PermissionsGuard } from '@common/guards/permissions.guard';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => {
  return applyDecorators(UseGuards(PermissionsGuard), SetMetadata(PERMISSIONS_KEY, permissions));
};
