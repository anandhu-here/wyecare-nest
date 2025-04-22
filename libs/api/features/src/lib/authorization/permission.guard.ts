import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from './services/authorization.service';
import { Types } from 'mongoose';
import { PERMISSIONS_KEY } from './permissions.decorator';
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  private readonly systemPermissions = [
    'create_organization',
    'manage_system_settings',
  ];
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('PermissionGuard canActivate called');
    const handler = context.getHandler();
    const classRef = context.getClass();
    this.logger.debug('Handler:', handler.name);
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler()
    );
    this.logger.debug('Required permissions:', requiredPermissions);
    const requireAny = this.reflector.get<string[]>(
      'requireAny',
      context.getHandler()
    );
    this.logger.debug('Require any permissions:', requireAny);
    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!requireAny || requireAny.length === 0)
    ) {
      this.logger.debug('No permissions required, allowing access');
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    this.logger.log('current org in request:', user.currentOrganization);
    if (!user) {
      this.logger.warn('No authenticated user found');
      throw new ForbiddenException('User is not authenticated');
    }
    this.logger.debug(`User ID: ${user._id}`);
    const systemLevelPermissions =
      requiredPermissions?.filter((p) => this.systemPermissions.includes(p)) ||
      [];
    const orgLevelPermissions =
      requiredPermissions?.filter((p) => !this.systemPermissions.includes(p)) ||
      [];
    if (systemLevelPermissions.length > 0) {
      this.logger.debug(
        `Checking system-level permissions: ${systemLevelPermissions}`
      );
      for (const permission of systemLevelPermissions) {
        const hasPermission = await this.authorizationService.hasPermission(
          new Types.ObjectId(user._id),
          permission,
          { contextType: 'SYSTEM' }
        );
        this.logger.debug(`User has ${permission}: ${hasPermission}`);
        if (!hasPermission) {
          throw new ForbiddenException(
            `Missing required system permission: ${permission}`
          );
        }
      }
    }
    if (orgLevelPermissions.length === 0 && requireAny?.length === 0) {
      return true;
    }
    const organizationId =
      request.params.organizationId ||
      request.query.organizationId ||
      request.body.organizationId ||
      request.headers['x-organization-id'] ||
      (request.currentOrganization && request.currentOrganization._id);
    if (!organizationId) {
      this.logger.warn('No organization context found');
      throw new ForbiddenException('No organization context found');
    }
    const hasAccess =
      await this.authorizationService.validateUserOrganizationAccess(
        new Types.ObjectId(user._id),
        new Types.ObjectId(organizationId)
      );
    if (!hasAccess) {
      this.logger.warn(
        `User ${user._id} not authorized for organization ${organizationId}`
      );
      throw new ForbiddenException('User not authorized for this organization');
    }
    if (requireAny && requireAny.length > 0) {
      this.logger.debug(
        `Checking if user has any of these permissions: ${requireAny}`
      );
      for (const permission of requireAny) {
        const hasPermission = await this.authorizationService.hasPermission(
          new Types.ObjectId(user._id),
          permission,
          {
            organizationId: new Types.ObjectId(organizationId),
            contextType: 'ORGANIZATION',
          }
        );
        if (hasPermission) {
          this.logger.debug(`User has required permission: ${permission}`);
          return true;
        }
      }
      throw new ForbiddenException(
        'User does not have any of the required permissions'
      );
    }
    if (orgLevelPermissions.length > 0) {
      this.logger.debug(
        `Checking organization-level permissions: ${orgLevelPermissions}`
      );
      for (const permission of orgLevelPermissions) {
        const hasPermission = await this.authorizationService.hasPermission(
          new Types.ObjectId(user._id),
          permission,
          {
            organizationId: new Types.ObjectId(organizationId),
            contextType: 'ORGANIZATION',
          }
        );
        if (!hasPermission) {
          this.logger.warn(`User missing permission: ${permission}`);
          throw new ForbiddenException(
            `Missing required permission: ${permission}`
          );
        }
      }
    }
    return true;
  }
}
