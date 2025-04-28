// auth.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from './permission.guard';
import {
  RequirePermission,
  RequireAllPermissions,
  RequireAnyPermission,
} from './permissions.decorator';
import { OrganizationContextGuard } from '../organizations/organization-context.guard';
import { OrganizationAccessGuard } from './organization-access.guard';

export function Auth(permission?: string) {
  const decorators = [
    UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionGuard),
  ];

  if (permission) {
    decorators.push(RequirePermission(permission));
  }

  return applyDecorators(...decorators);
}

export function AuthAll(permissions: string[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PermissionGuard),
    RequireAllPermissions(permissions)
  );
}

export function AuthAny(permissions: string[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PermissionGuard),
    RequireAnyPermission(permissions)
  );
}
