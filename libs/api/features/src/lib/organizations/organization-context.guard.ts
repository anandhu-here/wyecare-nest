// organization-context.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationsService } from './services/organizations.service';

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  private readonly logger = new Logger(OrganizationContextGuard.name);

  constructor(private organizationsService: OrganizationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.debug('No authenticated user found');
      return false;
    }

    // Extract organization ID from various sources
    const explicitOrgId =
      request.params.organizationId ||
      request.query.organizationId ||
      request.body.organizationId ||
      request.headers['x-organization-id'];

    try {
      if (explicitOrgId) {
        // User provided a specific organization ID
        this.logger.debug(`Using explicit organization ID: ${explicitOrgId}`);

        // Check if user has access to this organization
        const hasAccess =
          await this.organizationsService.validateUserOrganizationAccess(
            new Types.ObjectId(user._id),
            new Types.ObjectId(explicitOrgId)
          );

        if (hasAccess) {
          // Get organization details
          const organization = await this.organizationsService.getOrganization(
            new Types.ObjectId(explicitOrgId)
          );

          // Get user's role in this organization
          const roles =
            await this.organizationsService.getUserHighestAndLowestRoles(
              user._id
            );
          const relevantRole = roles.totalRoles?.find(
            (role) => role.organization._id.toString() === explicitOrgId
          );

          if (organization && relevantRole) {
            request.currentOrganization = organization;
            request.userOrganizationRole = relevantRole;
            this.logger.debug(
              `Set explicit organization context: ${organization.name}`
            );
          }
        }
      } else {
        // No explicit ID - use primary organization
        this.logger.debug('Resolving primary organization for user');
        const organization = await this.organizationsService.getMyOrganization(
          new Types.ObjectId(user._id)
        );

        if (organization) {
          request.currentOrganization = organization;

          // Get role information
          const roles =
            await this.organizationsService.getUserHighestAndLowestRoles(
              user._id
            );
          request.userOrganizationRole = roles.primaryRole;

          this.logger.debug(
            `Set primary organization context: ${organization.name}`
          );
        }
      }
    } catch (error: any) {
      // Log error but don't block request - just continue without organization context
      this.logger.error(
        `Error resolving organization context: ${error.message}`
      );
    }

    return true;
  }
}
