import { RolesGuard } from '@common/guards/roles.guard';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => {
  return applyDecorators(UseGuards(RolesGuard), SetMetadata(ROLES_KEY, roles));
};
