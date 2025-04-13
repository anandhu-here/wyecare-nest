import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSIONS_KEY, [permission]);
export const RequireAllPermissions = (permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
export const RequireAnyPermission = (permissions: string[]) =>
  SetMetadata('requireAny', permissions);
